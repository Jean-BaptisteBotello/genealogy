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
| Modifier les champs | Toute personne (prenom, nom, dates, lieux, notes) |
| Ajouter une personne | Nouvel individu dans l'arbre |
| Supprimer une personne | Personne existante |
| Ajouter une relation | PARENT_CHILD, UNION, ADOPTION, SIBLING, HALF_SIBLING, STEP |
| Supprimer une relation | Relation existante |

### Hors périmètre

- Documents PDF (ajout et suppression exclus)
- Branches (gestion des branches exclue)
- Notifications email (in-UI uniquement)

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
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           suggestion_type NOT NULL,
  target_id      UUID,           -- person.id ou relationship.id selon le type (null pour ADD)
  payload        JSONB NOT NULL DEFAULT '{}',
  status         suggestion_status NOT NULL DEFAULT 'PENDING',
  suggested_by   UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by    UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ
);
```

### Contenu du payload par type

| Type | Payload |
|---|---|
| `EDIT_PERSON` | `{ "prenom"?: "…", "nom"?: "…", "date_naissance"?: "…", "lieu_naissance"?: "…", "date_deces"?: "…", "lieu_deces"?: "…", "notes"?: "…" }` — uniquement les champs modifiés |
| `ADD_PERSON` | Fiche complète : `{ "prenom": "…", "nom": "…", … }` |
| `DELETE_PERSON` | `{}` — target_id suffit |
| `ADD_RELATIONSHIP` | `{ "person_a_id": "…", "person_b_id": "…", "type": "UNION", "metadata"?: {} }` |
| `DELETE_RELATIONSHIP` | `{}` — target_id = relationship.id |

### RLS

- Tout utilisateur authentifié peut **insérer** une suggestion (VIEWER inclus).
- Un utilisateur peut **lire** ses propres suggestions (toutes statuts).
- ADMIN et EDITOR peuvent **lire** toutes les suggestions PENDING.
- ADMIN et EDITOR peuvent **mettre à jour** le statut, `reviewed_by`, `rejection_reason`, `reviewed_at`.

---

## Architecture applicative

### Nouveau fichier de types

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
```

### Server actions — `src/server-actions/suggestions.ts`

```typescript
// Crée une suggestion PENDING — accessible à tous les rôles authentifiés
createSuggestion(type: SuggestionType, payload: Record<string, unknown>, targetId?: string): Promise<{ error?: string }>

// ADMIN/EDITOR : toutes les suggestions PENDING
// VIEWER : ses propres suggestions (tous statuts) pour voir refus + raisons
getSuggestions(): Promise<SuggestionWithProposer[]>

// ADMIN/EDITOR uniquement : applique le changement + marque APPROVED
approveSuggestion(id: string): Promise<{ error?: string }>

// ADMIN/EDITOR uniquement : marque REJECTED avec raison
rejectSuggestion(id: string, reason: string): Promise<{ error?: string }>
```

`SuggestionWithProposer` étend `Suggestion` avec `users: { email: string; display_name: string } | null`.

### Logique d'approbation (dans `approveSuggestion`)

```
EDIT_PERSON  → updatePerson(target_id, payload)
ADD_PERSON   → createPerson(payload)
DELETE_PERSON → deletePerson(target_id)
ADD_RELATIONSHIP → createRelationship(payload)
DELETE_RELATIONSHIP → deleteRelationship(target_id)
```

Puis `UPDATE suggestion SET status='APPROVED', reviewed_by=user.id, reviewed_at=now()`.

---

## Composants UI

### `src/components/suggestions/SuggestionModal.tsx`

Formulaire pour créer une suggestion. Reçoit `mode` :
- `{ type: 'EDIT_PERSON', person: Person }` — champs pré-remplis, soumet uniquement les champs modifiés
- `{ type: 'ADD_PERSON' }` — formulaire vierge identique au PersonModal
- `{ type: 'DELETE_PERSON', person: Person }` — confirmation simple
- `{ type: 'ADD_RELATIONSHIP', persons: Person[] }` — formulaire de relation
- `{ type: 'DELETE_RELATIONSHIP', relationship: Relationship }` — confirmation simple

### `src/components/suggestions/SuggestionsPanel.tsx`

Panneau (modal plein écran ou slide-over) pour ADMIN/EDITOR. Liste toutes les suggestions PENDING. Pour chaque suggestion :
- Qui propose (email), quand
- Résumé lisible du changement (diff des champs pour EDIT, nom/prénom pour ADD, etc.)
- Boutons Approuver / Rejeter (rejeter ouvre un champ textarea pour la raison)

### `src/components/suggestions/MySuggestionsPanel.tsx`

Panneau pour VIEWER. Liste ses propres suggestions avec statut et raison de refus si REJECTED.

### Modifications des composants existants

**`src/components/layout/Topbar.tsx`**
- Badge numérique sur un bouton "Suggestions" (ADMIN/EDITOR) affichant le nombre de PENDING
- Bouton "Mes propositions" (VIEWER) ouvrant MySuggestionsPanel
- Pour VIEWER : bouton "+ Ajouter" devient "Proposer une personne" → ouvre SuggestionModal en mode ADD_PERSON

**`src/components/layout/DetailPanel.tsx`**
- Pour VIEWER : bouton "Proposer une modification" → SuggestionModal EDIT_PERSON, bouton "Proposer la suppression" → SuggestionModal DELETE_PERSON. Pour chaque relation : bouton "Proposer suppression".
- Pour ADMIN/EDITOR : section "N suggestions en attente" si des suggestions PENDING ciblent cette personne, avec boutons Approuver/Rejeter inline.

**`src/lib/context/tree-context.tsx`**
- Ajouter `pendingSuggestionsCount: number` pour alimenter le badge Topbar.

**`src/app/(app)/layout.tsx`**
- Ajouter une requête `suggestion` pour récupérer le compte PENDING (ADMIN/EDITOR) ou les suggestions de l'utilisateur (VIEWER).

---

## Flux utilisateur

### VIEWER propose une modification

1. Ouvre le DetailPanel d'une personne
2. Clique "Proposer une modification"
3. SuggestionModal s'ouvre, champs pré-remplis
4. Modifie un ou plusieurs champs, soumet
5. Toast de confirmation "Proposition envoyée"
6. La suggestion apparaît dans "Mes propositions" avec statut PENDING

### ADMIN/EDITOR valide

1. Badge dans la Topbar indique N suggestions en attente
2. Clique → SuggestionsPanel s'ouvre
3. Voit le diff de chaque suggestion, choisit Approuver ou Rejeter
4. Si Approuver : le changement est appliqué immédiatement, badge décrémenté
5. Si Rejeter : saisit une raison, envoie
6. Le VIEWER verra le statut REJECTED + la raison dans "Mes propositions"

---

## Gestion des erreurs

- Si `approveSuggestion` échoue (ex : personne déjà supprimée) → suggestion marquée REJECTED avec raison technique, toast d'erreur pour l'admin.
- Suggestions orphelines (target_id introuvable) : détectées à l'approbation, rejetées automatiquement avec message "Cible introuvable".
- Un VIEWER ne peut pas soumettre deux suggestions PENDING identiques sur la même cible — vérification applicative (même type + même target_id en statut PENDING).

---

## Tests

- `src/server-actions/__tests__/suggestions.test.ts` — tests unitaires pour les 4 actions avec mocks Supabase
- `src/components/suggestions/__tests__/SuggestionModal.test.tsx` — rendu, soumission, validation
- `src/components/suggestions/__tests__/SuggestionsPanel.test.tsx` — liste, approbation, rejet
- `src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx` — liste des suggestions du VIEWER

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

-- RLS
ALTER TABLE suggestion ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut créer une suggestion
CREATE POLICY "suggestion_insert" ON suggestion
  FOR INSERT WITH CHECK (auth.uid() = suggested_by);

-- Un utilisateur voit ses propres suggestions
CREATE POLICY "suggestion_select_own" ON suggestion
  FOR SELECT USING (auth.uid() = suggested_by);

-- ADMIN et EDITOR voient toutes les suggestions PENDING
CREATE POLICY "suggestion_select_reviewers" ON suggestion
  FOR SELECT USING (
    current_user_role() IN ('ADMIN', 'EDITOR')
  );

-- ADMIN et EDITOR peuvent mettre à jour (approuver/rejeter)
CREATE POLICY "suggestion_update_reviewers" ON suggestion
  FOR UPDATE USING (
    current_user_role() IN ('ADMIN', 'EDITOR')
  );
```
