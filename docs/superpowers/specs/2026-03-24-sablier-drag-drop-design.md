# Spec : Drag & Drop dans la vue Sablier (Plan 9)

*Date : 24 mars 2026*
*Statut : Validée*

---

## Contexte

La vue Sablier utilise ReactFlow pour afficher l'arbre généalogique en layout générationnel. Les nœuds sont positionnés par un algorithme déterministe (`computeSablierLayout`). L'utilisateur ne peut pas les déplacer, ce qui cause des chevauchements visuels entre liens et nœuds quand l'arbre est dense.

---

## Objectif

Permettre à l'utilisateur de déplacer les nœuds par glisser-déposer dans la vue Sablier, avec sauvegarde des positions en `localStorage` et possibilité de réinitialiser au layout automatique.

---

## Design

### Drag & drop

Activer le drag natif de ReactFlow via `nodesDraggable={true}` et `onNodesChange`. Les arêtes suivent automatiquement les nœuds déplacés (comportement natif ReactFlow).

### Sauvegarde des positions

- Clé `localStorage` : `sablier_positions`
- Format : `Record<string, { x: number, y: number }>` (personId → position absolue)
- Sauvegardé à chaque `onNodeDragStop` (pas à chaque frame de drag)
- Au chargement : les positions sauvées écrasent celles du layout automatique pour les nœuds correspondants
- Les nœuds sans position sauvée gardent leur position calculée

### Bouton réinitialiser

- Visible uniquement quand au moins une position custom existe dans `localStorage`
- Position : bas droite de la vue (à côté du badge orphelins existant, au-dessus)
- Clic : supprime `sablier_positions` du `localStorage`, recalcule toutes les positions via le layout automatique
- Feedback : les nœuds reviennent instantanément à leur position auto

### Hint au survol

Pas de hint textuel — le curseur `grab` / `grabbing` suffit (comportement natif ReactFlow, `cursor: grab` est le défaut quand `nodesDraggable` est activé).

---

## Composants modifiés

### `SablierView.tsx`

- Ajouter `useState` pour les positions custom (`customPositions`)
- Ajouter `useEffect` pour charger depuis `localStorage` au montage
- Fusionner positions custom + layout auto dans `rfNodes`
- Ajouter `onNodesChange` pour gérer les `NodeChange[]` de type `position`
- Ajouter `onNodeDragStop` pour persister dans `localStorage`
- Ajouter bouton "Réinitialiser les positions"
- Passer `nodesDraggable={true}` à `<ReactFlow>`

### Aucun autre fichier modifié

Pas de migration DB, pas de nouveau composant, pas de modification du layout algorithm.

---

## Tests

- **Component** : `SablierView` — nœuds ont `draggable` activé, bouton reset absent par défaut, bouton reset visible après déplacement
- **Unit** : logique de fusion positions custom + layout auto

---

## Hors périmètre

- Partage des positions entre utilisateurs (nécessiterait du stockage DB)
- Sauvegarde automatique côté serveur
- Animation de transition lors du reset
