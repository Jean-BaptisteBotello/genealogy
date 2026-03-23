# Suggestions de modifications — Design Spec

*Date : 23 mars 2026*

---

## Objectif

Permettre aux VIEWERs de proposer des modifications sur l'arbre généalogique (personnes, relations) sans pouvoir les appliquer directement. Les ADMIN et EDITOR examinent, approuvent ou rejettent ces suggestions. Les VIEWERs voient le statut de leurs propositions et les éventuels commentaires de refus.

---

## Périmètre

### Ce que les VIEWERs peuvent proposer

| Action | Cible |
|---|---|
| Modifier les champs | Toute personne (prenom, nom, dates, lieux, lat/lon, notes) |
| Ajouter une personne | Nouvel individu dans l'arbre |
| Supprimer une personne | Personne existante |
| Ajouter une relation | PARENT_CHILD, UNION, ADOPTION, SIBLING, HALF_SIBLING, STEP |
| Supprimer une relation | Relation existante |

Un VIEWER peut **annuler** une suggestion PENDING qu'il a lui-même créée.

### Hors périmètre

- Documents PDF (ajout et suppression exclus)
- Branches (gestion des branches exclue)
- Notifications email (in-UI uniquement)

---

## Décisions de design

- **EDITOR = même autorité que ADMIN pour valider/rejeter.** Un EDITOR peut déjà écrire directement dans l'arbre, il est donc légitime qu'il valide les suggestions. Seul l'ADMIN peut supprimer — mais cette distinction existe déjà via les server actions existantes et s'applique aussi lors de l'approbation.
- **`getSuggestions` est scindée en deux fonctions** (`getSuggestionsPending` et `getMySuggestions`) pour éviter une signature à comportement implicite.
- **Coordonnées lat/lon** : calculées par géocodage server-side à partir des champs `lieu_*`. Elles ne sont pas éditables directement par les VIEWERs — exclues du payload `EDIT_PERSON`.
- **Approbation best-effort** : pas de transaction distribuée. Si le changement s'applique mais que la mise à jour du statut échoue (cas extrêmement rare), la suggestion reste PENDING — l'admin peut retenter. En cas d'échec de l'action métier (personne introuvable, etc.), la suggestion reste PENDING avec un toast d'erreur pour l'admin, sans la rejeter automatiquement.
- **Join sur `public.users`** (table applicative, pas `auth.users`) — cohérent avec l'existant dans `members.ts`. Les FK de `suggestion.suggested_by` et `reviewed_by` pointent vers `auth.users(id)` pour l'intégrité référentielle ; le join pour l'affichage cible `public.users` car `public.users.id` est le même UUID que `auth.users.id` dans Supabase.
- **`getSuggestionsPending` appelée par un VIEWER** : la RLS filtre les lignes (le VIEWER ne voit que ses propres suggestions), donc la fonction retourne un tableau vide — pas d'erreur. Ce comportement est intentionnel et cohérent avec le pattern des autres actions.
- **Double-application en cas de retry** : si la mise à jour du statut échoue après que l'action métier a réussi, un second appel à `approveSuggestion` appliquera l'action une deuxième fois. Les actions existantes (`updatePerson`, `deletePerson`, etc.) gèrent le cas "cible introuvable" en retournant `{ error }` — ce qui protège contre le double-delete. `createPerson` peut créer un doublon — acceptable en V2, l'admin devra supprimer manuellement.

---

## Schéma de données

### Nouveaux types ENUM (migration SQL)

```sql
CREATE TYPE suggestion_type AS ENUM (
  'EDIT_PERSON',
  'ADD_PERSON',
  'DELETE_PERSON',
  'ADD_RELATIONSHIP',
  'DELETE_RELATIONSHIP'
);

CREATE TYPE suggestion_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);
```

### Table `suggestion`

```sql
CREATE TABLE suggestion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             suggestion_type NOT NULL,
  target_id        UUID,           -- person.id ou relationship.id (null pour ADD_*)
  payload          JSONB NOT NULL DEFAULT '{}',
  status           suggestion_status NOT NULL DEFAULT 'PENDING',
  suggested_by     UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by      UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ
);

-- Index pour les requêtes fréquentes
CREATE INDEX suggestion_status_idx ON suggestion(status);
CREATE INDEX suggestion_suggested_by_idx ON suggestion(suggested_by);

-- Anti-doublon : un VIEWER ne peut pas avoir deux suggestions PENDING
-- identiques sur la même cible. Fonctionne pour EDIT/DELETE (target_id non null).
-- Pour ADD_PERSON (target_id null), la contrainte est purement applicative.
CREATE UNIQUE INDEX suggestion_no_duplicate_pending
  ON suggestion (suggested_by, type, target_id)
  WHERE status = 'PENDING' AND target_id IS NOT NULL;
```

### Contenu du payload par type

| Type | Payload |
|---|---|
| `EDIT_PERSON` | Uniquement les champs modifiés parmi : `prenom`, `nom`, `date_naissance`, `lieu_naissance`, `date_deces`, `lieu_deces`, `notes` |
| `ADD_PERSON` | Fiche complète : `{ prenom, nom, date_naissance?, lieu_naissance?, date_deces?, lieu_deces?, notes? }` |
| `DELETE_PERSON` | `{}` — target_id suffit |
| `ADD_RELATIONSHIP` | `{ person_a_id, person_b_id, type, metadata? }` |
| `DELETE_RELATIONSHIP` | `{}` — target_id = relationship.id |

**Validation du payload** : chaque payload est parsé côté serveur via Zod avant d'être utilisé dans `approveSuggestion`. Les clés inattendues sont ignorées, les types incorrects déclenchent une erreur retournée à l'admin (suggestion reste PENDING).

### Schémas Zod (à définir dans `src/lib/validation/suggestions.ts`)

```typescript
const editPersonPayloadSchema = z.object({
  prenom: z.string().optional(),
  nom: z.string().optional(),
  date_naissance: z.string().nullable().optional(),
  lieu_naissance: z.string().nullable().optional(),
  date_deces: z.string().nullable().optional(),
  lieu_deces: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const addPersonPayloadSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  date_naissance: z.string().nullable().optional(),
  lieu_naissance: z.string().nullable().optional(),
  date_deces: z.string().nullable().optional(),
  lieu_deces: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const addRelationshipPayloadSchema = z.object({
  person_a_id: z.string().uuid(),
  person_b_id: z.string().uuid(),
  type: z.enum(['PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP']),
  metadata: z.record(z.unknown()).optional(),
})
```

### RLS

```sql
ALTER TABLE suggestion ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut créer une suggestion
CREATE POLICY "suggestion_insert" ON suggestion
  FOR INSERT WITH CHECK (auth.uid() = suggested_by);

-- Un utilisateur voit ses propres suggestions (tous statuts — pour voir ses refus)
CREATE POLICY "suggestion_select_own" ON suggestion
  FOR SELECT USING (auth.uid() = suggested_by);

-- ADMIN et EDITOR voient TOUTES les suggestions (tous statuts)
-- pour pouvoir consulter l'historique et revalider si besoin
CREATE POLICY "suggestion_select_reviewers" ON suggestion
  FOR SELECT USING (current_user_role() IN ('ADMIN', 'EDITOR'));

-- ADMIN et EDITOR peuvent mettre à jour (approuver/rejeter)
CREATE POLICY "suggestion_update_reviewers" ON suggestion
  FOR UPDATE USING (current_user_role() IN ('ADMIN', 'EDITOR'));

-- Un VIEWER peut annuler (DELETE) sa propre suggestion PENDING
CREATE POLICY "suggestion_delete_own_pending" ON suggestion
  FOR DELETE USING (
    auth.uid() = suggested_by AND status = 'PENDING'
  );
```

---

## Architecture applicative

### Types TypeScript

`src/lib/types/database.ts` — ajouter :

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
  users: { email: string; display_name: string } | null  // join sur public.users
}
```

### Validation Zod

Nouveau fichier : `src/lib/validation/suggestions.ts`
Contient les schémas Zod décrits ci-dessus + une fonction `parsePayload(type, payload)` qui retourne le payload typé ou lance une erreur.

### Server actions — `src/server-actions/suggestions.ts`

```typescript
// Crée une suggestion PENDING — accessible à tous les rôles authentifiés
// Vérification applicative anti-doublon pour ADD_PERSON (target_id null)
createSuggestion(
  type: SuggestionType,
  payload: Record<string, unknown>,
  targetId?: string
): Promise<{ error?: string }>

// ADMIN/EDITOR : toutes les suggestions PENDING (pour le badge + SuggestionsPanel)
getSuggestionsPending(): Promise<SuggestionWithProposer[]>

// VIEWER (et tous rôles) : suggestions de l'utilisateur courant, tous statuts
// Pour voir ses propositions + raisons de refus
getMySuggestions(): Promise<SuggestionWithProposer[]>

// ADMIN/EDITOR uniquement.
// 1. Parse et valide le payload via Zod
// 2. Applique le changement (action existante)
// 3. Marque APPROVED — si l'action métier échoue, retourne { error } et laisse PENDING
approveSuggestion(id: string): Promise<{ error?: string }>

// ADMIN/EDITOR uniquement. Marque REJECTED avec raison.
rejectSuggestion(id: string, reason: string): Promise<{ error?: string }>

// Tout utilisateur authentifié — uniquement sur ses propres suggestions PENDING
cancelSuggestion(id: string): Promise<{ error?: string }>
```

### Logique d'approbation (dans `approveSuggestion`)

```
1. Charger la suggestion par id (vérifier qu'elle est PENDING)
2. Parser le payload avec parsePayload(type, payload) → erreur → retourner { error }
3. Selon type :
   EDIT_PERSON        → updatePerson(target_id, parsedPayload)
   ADD_PERSON         → createPerson(parsedPayload)
   DELETE_PERSON      → deletePerson(target_id)
   ADD_RELATIONSHIP   → createRelationship(parsedPayload)
   DELETE_RELATIONSHIP → deleteRelationship(target_id)
4. Si l'action retourne { error } → retourner { error }, laisser suggestion PENDING
5. UPDATE suggestion SET status='APPROVED', reviewed_by=user.id, reviewed_at=now()
6. revalidatePath('/tree', 'layout')
```

---

## Composants UI

### `src/components/suggestions/SuggestionModal.tsx`

Formulaire pour créer une suggestion. Reçoit `mode` :

- `{ type: 'EDIT_PERSON', person: Person }` — champs pré-remplis, soumet uniquement les champs modifiés
- `{ type: 'ADD_PERSON' }` — formulaire vierge (identique au PersonModal mais soumet comme suggestion)
- `{ type: 'DELETE_PERSON', person: Person }` — confirmation simple
- `{ type: 'ADD_RELATIONSHIP', persons: Person[] }` — formulaire de relation
- `{ type: 'DELETE_RELATIONSHIP', relationship: Relationship }` — confirmation simple

### `src/components/suggestions/SuggestionsPanel.tsx`

Panneau pour ADMIN/EDITOR. Liste toutes les suggestions PENDING. Pour chaque :
- Qui propose (email), quand
- Résumé lisible du changement (diff des champs pour EDIT, nom complet pour ADD, etc.)
- Boutons Approuver / Rejeter (rejeter ouvre un textarea pour la raison)

### `src/components/suggestions/MySuggestionsPanel.tsx`

Panneau pour tous les rôles (principalement VIEWER). Liste les suggestions de l'utilisateur courant. Pour chaque :
- Type et description du changement proposé
- Statut (PENDING / APPROVED / REJECTED)
- Si REJECTED : raison visible
- Si PENDING : bouton "Annuler" (appelle `cancelSuggestion`)

### Modifications des composants existants

**`src/components/layout/Topbar.tsx`**
- Badge numérique sur un bouton "Suggestions" (ADMIN/EDITOR) — affiche `pendingSuggestionsCount` ; clique ouvre SuggestionsPanel
- Bouton "Mes propositions" (tous rôles) ouvrant MySuggestionsPanel
- Pour VIEWER : bouton "+ Ajouter" devient "Proposer une personne" → SuggestionModal ADD_PERSON

**`src/components/layout/DetailPanel.tsx`**
- Pour VIEWER : bouton "Proposer une modification" → SuggestionModal EDIT_PERSON ; bouton "Proposer la suppression" → SuggestionModal DELETE_PERSON
- Pour VIEWER : chaque relation affiche "Proposer suppression" → SuggestionModal DELETE_RELATIONSHIP
- Pour ADMIN/EDITOR : section "N suggestions en attente" (suggestions PENDING avec ce target_id) avec boutons Approuver/Rejeter inline

**`src/lib/context/tree-context.tsx`**
- Ajouter `pendingSuggestionsCount: number`

**`src/app/(app)/layout.tsx`**
- Ajouter une requête : count des suggestions PENDING (pour ADMIN/EDITOR) ou `getMySuggestions` (pour afficher un badge sur "Mes propositions" pour VIEWER)
- Passer `pendingSuggestionsCount` à AppShell → TreeContext

---

## Flux utilisateur

### VIEWER propose une modification

1. Ouvre le DetailPanel d'une personne
2. Clique "Proposer une modification"
3. SuggestionModal s'ouvre, champs pré-remplis
4. Modifie un ou plusieurs champs, soumet
5. Toast "Proposition envoyée"
6. La suggestion apparaît dans "Mes propositions" avec statut PENDING
7. Un VIEWER peut annuler depuis "Mes propositions" tant que c'est PENDING

### ADMIN/EDITOR valide

1. Badge dans la Topbar indique N suggestions en attente
2. Clique → SuggestionsPanel s'ouvre
3. Voit le diff de chaque suggestion, choisit Approuver ou Rejeter
4. Si Approuver : payload validé, changement appliqué, badge décrémenté
5. Si l'application échoue (ex : personne déjà supprimée) : toast d'erreur pour l'admin, suggestion reste PENDING — il peut retenter ou rejeter manuellement
6. Si Rejeter : saisit une raison, envoie
7. Le VIEWER verra le statut REJECTED + la raison dans "Mes propositions"

---

## Gestion des erreurs

- **Payload invalide** : `approveSuggestion` retourne `{ error }`, suggestion reste PENDING, toast pour l'admin
- **Cible introuvable** : l'action métier retourne `{ error }`, suggestion reste PENDING
- **Doublon ADD_PERSON** : vérification applicative dans `createSuggestion` — requête SELECT avant INSERT pour détecter une suggestion PENDING identique du même utilisateur
- **Erreur réseau sur mise à jour du statut** : suggestion laissée PENDING, l'admin peut retenter (idempotence de l'approbation n'est pas garantie dans ce cas — acceptable en V2)

---

## Tests

- `src/server-actions/__tests__/suggestions.test.ts`
  - `createSuggestion` : succès, doublon (target_id non null), doublon ADD_PERSON, non authentifié
  - `getSuggestionsPending` : ADMIN reçoit PENDING, VIEWER bloqué
  - `getMySuggestions` : retourne les suggestions de l'utilisateur courant
  - `approveSuggestion` : succès par type, payload invalide, cible introuvable, non ADMIN/EDITOR
  - `rejectSuggestion` : succès, non ADMIN/EDITOR
  - `cancelSuggestion` : succès sur PENDING propre, échec sur APPROVED, échec sur suggestion d'autrui

- `src/components/suggestions/__tests__/SuggestionModal.test.tsx`
  - Rendu par mode, soumission, validation champs requis

- `src/components/suggestions/__tests__/SuggestionsPanel.test.tsx`
  - Liste PENDING, approbation, rejet avec raison

- `src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx`
  - Liste, affichage raison de refus, bouton annuler

---

## Migration SQL

Fichier : `supabase/migrations/002_suggestions.sql`

```sql
-- Types ENUM
CREATE TYPE suggestion_type AS ENUM (
  'EDIT_PERSON', 'ADD_PERSON', 'DELETE_PERSON',
  'ADD_RELATIONSHIP', 'DELETE_RELATIONSHIP'
);

CREATE TYPE suggestion_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Table
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

-- Index
CREATE INDEX suggestion_status_idx ON suggestion(status);
CREATE INDEX suggestion_suggested_by_idx ON suggestion(suggested_by);

-- Anti-doublon pour les suggestions avec cible connue (EDIT/DELETE)
CREATE UNIQUE INDEX suggestion_no_duplicate_pending
  ON suggestion (suggested_by, type, target_id)
  WHERE status = 'PENDING' AND target_id IS NOT NULL;

-- RLS
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
