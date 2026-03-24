# Spec : Lier des personnes — Feature "Link Person" (Plan 7)

*Date : 24 mars 2026*
*Statut : Révisée post-review*

---

## Contexte

Actuellement, il est impossible de créer des relations entre personnes depuis l'interface : le `DetailPanel` affiche les relations existantes mais n'offre aucun bouton d'ajout pour ADMIN/EDITOR. La seule voie est via le système de suggestions (VIEWER → propose → ADMIN valide), inadapté pour l'ADMIN qui construit l'arbre.

---

## Objectif

Permettre à un ADMIN/EDITOR de lier une personne à une autre directement depuis le panneau de détail, en choisissant un rôle humain lisible (père, mère, époux, grand-père, oncle…).

---

## Phase 1 : Liens directs avec rôle en metadata

### Principe

Tous les rôles (directs ET indirects) sont stockés en DB via la table `relationship` existante — **sans migration de schéma**. Le rôle humain est stocké dans le champ `metadata` JSONB :

```json
{ "role": "grand-père" }
```

Le `relationship_type` et la direction (`person_a_id` / `person_b_id`) sont dérivés du rôle **dans `LinkPersonForm`** (côté client), avant d'appeler le server action existant `createRelationship` avec les valeurs correctes.

### Mapping rôle → type DB + direction

| Rôle | type DB | person_a_id | person_b_id |
|------|---------|-------------|-------------|
| Père | PARENT_CHILD | autre | courant |
| Mère | PARENT_CHILD | autre | courant |
| Fils | PARENT_CHILD | courant | autre |
| Fille | PARENT_CHILD | courant | autre |
| Grand-père | PARENT_CHILD | autre | courant |
| Grand-mère | PARENT_CHILD | autre | courant |
| Arrière-grand-père | PARENT_CHILD | autre | courant |
| Arrière-grand-mère | PARENT_CHILD | autre | courant |
| Arrière-arrière-grand-père | PARENT_CHILD | autre | courant |
| Arrière-arrière-grand-mère | PARENT_CHILD | autre | courant |
| Frère | SIBLING | courant | autre |
| Sœur | SIBLING | courant | autre |
| Demi-frère | HALF_SIBLING | courant | autre |
| Demi-sœur | HALF_SIBLING | courant | autre |
| **Oncle** | **SIBLING** | autre | courant |
| **Tante** | **SIBLING** | autre | courant |
| Époux / Épouse | UNION | courant | autre |
| Beau-père | STEP | autre | courant |
| Belle-mère | STEP | autre | courant |
| Enfant adopté(e) | ADOPTION | courant | autre |

> **Note oncle/tante** : mappés sur `SIBLING` (non-hiérarchique) plutôt que `PARENT_CHILD` pour éviter d'interférer avec la cycle detection côté serveur (`CYCLE_CHECKED_TYPES = ['PARENT_CHILD', 'ADOPTION']`). Sémantiquement approximatif mais sans risque de corruption du graphe. Le `metadata.role` reste la source de vérité pour l'affichage.

> **Note rôles indirects ascendants** (grand-père, arrière-grand-père…) : stockés en `PARENT_CHILD`. Le cycle check vérifie si `person_b` (courant) est un ancêtre de `person_a` (grand-père) — ce qui est normalement faux, donc pas de faux positifs. Ces liens sont des **raccourcis Phase 1** : ils peuvent coexister avec une chaîne correctement modélisée (A → parent → grand-père), créant deux chemins PARENT_CHILD parallèles dans la DB. La Phase 2 devra **dédupliquer** ces raccourcis (pas seulement en déduire de nouveaux) avant qu'ils deviennent autoritaires.

---

## Server action existant

**`createRelationship` existe déjà** dans `src/server-actions/relationships.ts`. Il accepte un `FormData` avec :
- `person_a_id` — UUID
- `person_b_id` — UUID
- `type` — valeur de l'enum `relationship_type`
- `metadata` — JSON stringifié (optionnel)

Le server action gère déjà : cycle detection pour PARENT_CHILD/ADOPTION, RLS (ADMIN/EDITOR), `revalidatePath('/tree', 'layout')`.

**`LinkPersonForm` est responsable** de dériver `person_a_id`, `person_b_id`, `type` et `metadata` depuis le rôle sélectionné avant d'appeler l'action.

---

## UX : Inline dans le DetailPanel (Approche A)

Inspirée de Linear Method — actions contextuelles sans rupture de flow, UI ambiante.

### État fermé

```
RELATIONS                [+]
─────────────────────────────
  Parent / Enfant  Pierre Dupont
```

Le `[+]` est discret (text-[10px] text-gray-600), visible en permanence quand `currentRole !== 'VIEWER'`.

### État ouvert (après clic sur `[+]`)

```
RELATIONS                [✕]
─────────────────────────────
  🔍 Rechercher une personne…

  Pierre Dupont · 1960
  Marie Dupont   · 1962

  SON RÔLE
  [Père] [Mère] [Fils] [Fille]
  [Frère] [Sœur] [Époux/Épouse]
  ▸ Famille étendue ›
    [Grand-père] [Grand-mère]
    [Oncle] [Tante]
    [Arrière-grand-père] …

                    [Lier →]
```

### Détails UX

- La recherche filtre les personnes live (ilike sur prénom + nom), **exclut la personne courante**
- Le champ recherche est auto-focusé à l'ouverture du formulaire
- Les rôles "Famille étendue" sont repliés par défaut (progressive disclosure)
- Le bouton `[Lier →]` est désactivé tant que personne + rôle ne sont pas tous deux sélectionnés
- Après liaison réussie : le formulaire se ferme, `revalidatePath` rafraîchit la liste (pas d'optimistic update — la latence Supabase est acceptable)
- En cas d'erreur (cycle, doublon RLS) : message inline sous le formulaire

---

## Composants à créer / modifier

### Nouveau : `LinkPersonForm`
- Fichier : `src/components/person/LinkPersonForm.tsx`
- Client component
- Props : `{ currentPersonId: string, persons: Person[], onClose: () => void }`
  - `persons` = liste complète déjà chargée dans `DetailPanel` (via `allPersons`) — filtrage client-side, acceptable pour des arbres de taille raisonnable
- État interne : `selectedPersonId`, `selectedRole`, `searchQuery`, `isExtendedOpen`, `isPending`, `error`
- `currentRole` lu depuis `useTree()` directement (pas besoin de prop)
- Responsabilité : dériver `person_a_id`, `person_b_id`, `type`, `metadata` depuis le rôle → appeler `createRelationship` via `useTransition`

### Modifié : `DetailPanel`
- Ajouter état interne `isLinking: boolean` via `useState` (cohérent avec `isUploading`, `downloadingId`)
- Ajouter bouton `[+]` dans le header de la section Relations (visible si `currentRole !== 'VIEWER'`)
- Rendre `<LinkPersonForm>` inline quand `isLinking === true`
- **Mettre à jour ligne 257** : remplacer `{RELATION_LABEL[rel.type] ?? rel.type}` par `{(rel.metadata as { role?: string })?.role ?? RELATION_LABEL[rel.type] ?? rel.type}` pour afficher le rôle humain stocké en metadata

---

## Tests

- **Unit** : mapping rôle → type + direction (tous les rôles du tableau)
- **Unit** : cycle detection non déclenchée pour oncle/tante (type SIBLING)
- **Component** : `LinkPersonForm` — recherche filtrante (exclut personne courante), sélection rôle, submit disabled/enabled, message d'erreur, fermeture après succès
- **Component** : `DetailPanel` — bouton `[+]` visible pour ADMIN/EDITOR, caché pour VIEWER, affiche `metadata.role`
- **Integration** : ajout d'un lien père via le DetailPanel → relation apparaît dans la liste

---

## Phase 2 (future) : Déductions automatiques

Quand deux personnes partagent des ancêtres communs (détectés par traversée du graphe), l'app propose une modale "Relations déduites" listant les liens implicites (ex : "Ces deux personnes semblent être cousins — confirmer ?"). L'utilisateur valide ou rejette chaque suggestion.

**Non implémenté en Phase 1.**

---

## Hors périmètre Phase 1

- Suppression de relations depuis le DetailPanel pour ADMIN/EDITOR
- Déduction automatique de relations indirectes
- Edition d'une relation existante
