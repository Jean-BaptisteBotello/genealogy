# Spec : Gestion des liens — Suppression + Déplacement (Plan 10)

*Date : 26 mars 2026*
*Statut : Validée*

---

## Contexte

Le DetailPanel affiche les relations d'une personne mais ne permet ni de les supprimer ni de les modifier. Le server action `deleteRelationship` existe mais n'est pas exposé dans l'UI pour ADMIN/EDITOR. Il n'existe aucun moyen de déplacer un lien (changer la personne liée).

---

## Objectif

Permettre à un ADMIN/EDITOR de supprimer un lien et de déplacer un lien (changer la personne cible tout en conservant le rôle).

---

## Suppression d'un lien

### UX

Bouton ✕ affiché à droite de chaque relation dans le DetailPanel, visible uniquement pour `currentRole !== 'VIEWER'`. Au clic, `confirm("Supprimer ce lien ?")`. Si confirmé, appel à `deleteRelationship(relationshipId)` puis `router.refresh()`.

### Server action

`deleteRelationship` existe déjà dans `src/server-actions/relationships.ts`. Il accepte un `relationshipId: string`, vérifie les droits via RLS et supprime la ligne.

---

## Déplacement d'un lien

### UX

Bouton ✎ affiché à droite de chaque relation (avant le ✕), visible uniquement pour `currentRole !== 'VIEWER'`. Au clic :

1. La ligne de la relation est remplacée par un mini-formulaire inline
2. Le formulaire contient un champ de recherche (même pattern que LinkPersonForm — la liste n'apparaît que quand l'utilisateur tape)
3. L'utilisateur sélectionne la nouvelle personne cible
4. Un bouton "Déplacer →" confirme. Un bouton "Annuler" ferme le formulaire
5. Le rôle (`metadata.role`), le type, et la direction sont conservés — seule la personne cible change
6. Après succès, le formulaire se ferme et la liste se rafraîchit

### Server action

Nouveau : `moveRelationship` dans `src/server-actions/relationships.ts`.

```typescript
export async function moveRelationship(
  relationshipId: string,
  newPersonId: string
): Promise<{ error?: string }>
```

Logique :
1. Lire la relation existante (id, person_a_id, person_b_id, type, metadata)
2. Déterminer quelle personne est la "cible" à remplacer : la personne qui n'est PAS la personne actuellement affichée dans le DetailPanel → passée via un paramètre `currentPersonId`
3. Construire le nouveau lien : même type, même metadata, même `currentPersonId`, mais `newPersonId` remplace l'autre personne
4. Cycle detection sur le nouveau lien (pour PARENT_CHILD et ADOPTION)
5. Supprimer l'ancien lien
6. Créer le nouveau lien
7. `revalidatePath('/tree', 'layout')`

Signature mise à jour :

```typescript
export async function moveRelationship(
  relationshipId: string,
  currentPersonId: string,
  newPersonId: string
): Promise<{ error?: string }>
```

---

## Composants modifiés

### `DetailPanel.tsx`

Dans la section Relations, chaque ligne de relation affiche pour ADMIN/EDITOR :

```
[roleLabel] Nom Prénom  [✎] [✕]
```

- `[✎]` → ouvre le formulaire de déplacement pour cette relation (state `editingRelId`)
- `[✕]` → supprime après confirmation
- Un seul formulaire de déplacement ouvert à la fois (`editingRelId: string | null`)
- Le formulaire de déplacement est un composant inline `MoveRelationForm`

### Nouveau : `MoveRelationForm`

Fichier : `src/components/person/MoveRelationForm.tsx`

Props :
```typescript
interface MoveRelationFormProps {
  relationshipId: string
  currentPersonId: string
  persons: Person[]
  excludePersonId: string  // la personne actuellement liée (à exclure de la recherche)
  onClose: () => void
}
```

- Champ de recherche (affiche la liste uniquement quand l'utilisateur tape)
- Bouton "Déplacer →" disabled tant qu'aucune personne n'est sélectionnée
- Appelle `moveRelationship` via `useTransition`
- Ferme et rafraîchit après succès

### `relationships.ts`

Ajout de `moveRelationship`.

---

## Permissions

| Action | ADMIN | EDITOR | VIEWER |
|--------|-------|--------|--------|
| Supprimer un lien | ✓ | ✓ | ✗ (propose via suggestions) |
| Déplacer un lien | ✓ | ✓ | ✗ |

RLS existant couvre déjà ADMIN/EDITOR pour insert/delete sur `relationship`.

---

## Tests

- **Unit** : `moveRelationship` — conserve le rôle et type, remplace la personne, cycle detection bloque si nécessaire
- **Unit** : `deleteRelationship` — déjà testé
- **Component** : `DetailPanel` — boutons ✎ et ✕ visibles ADMIN/EDITOR, cachés VIEWER
- **Component** : `MoveRelationForm` — recherche, sélection, submit

---

## Hors périmètre

- Modifier le rôle d'une relation existante (changer père → oncle)
- Modifier le type de relation
- Déplacement en batch (plusieurs liens à la fois)
