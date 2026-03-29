# Sablier Flow View — Design Spec

*Date : 29 mars 2026*
*Statut : Validé*

---

## Contexte

Remplacer la vue Sablier actuelle (ReactFlow, graph de nœuds draggables) par une vue flow verticale inspirée du design Agent Orchestration Studio. Le nouveau design utilise des cards blanches, des containers d'union en dashed, des connexions SVG droites et un layout vertical automatique par génération.

**Référence visuelle :** `public/sablier-flow-mockup.html`

**Ce qui ne change pas :** Cosmos, Timeline, Carte, DetailPanel, Sidebar, Topbar.

---

## Architecture

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/components/views/sablier/sablierFlowLayout.ts` | Algorithme de layout : BFS depuis la personne sélectionnée, assignation de génération, groupement des unions, positionnement x/y |
| `src/components/views/sablier/SablierFlowView.tsx` | Composant React : rendu des cards, containers d'union, couche SVG de connexions |
| `src/components/views/sablier/sablierFlow.css` | Styles CSS : cards, unions, grille de points, labels de génération |

### Fichiers supprimés ou modifiés

| Fichier | Action |
|---------|--------|
| `src/components/views/sablier/SablierView.tsx` | Remplacé par SablierFlowView.tsx |
| `src/components/views/sablier/sablierLayout.ts` | Conservé (utilisé par les tests), mais plus importé par la vue |
| `src/components/views/ViewRouter.tsx` | Modifier l'import : SablierView → SablierFlowView |

---

## Layout (sablierFlowLayout.ts)

### Algorithme

1. **BFS** depuis `selectedPersonId` (ou première personne) pour assigner les générations :
   - PARENT_CHILD / ADOPTION : parent = gen - 1, enfant = gen + 1
   - UNION : même génération
   - SIBLING / HALF_SIBLING / STEP : même génération

2. **Groupement des unions** : pour chaque personne qui a une relation UNION, grouper le couple dans un `UnionGroup`.

3. **Détection de la fratrie** : personnes à la même génération qui partagent un parent commun avec la personne sélectionnée (gen 0 uniquement).

4. **Positionnement** :
   - Chaque génération occupe une rangée verticale
   - `ROW_HEIGHT = 200px` entre chaque génération
   - Les éléments (cards individuelles ou union groups) sont centrés horizontalement
   - Espacement horizontal : `COL_GAP = 40px`

### Types de sortie

```typescript
interface FlowNode {
  id: string
  generation: number
  x: number
  y: number
  role?: string // "Père", "Grand-mère", etc.
}

interface FlowUnion {
  personA: FlowNode
  personB: FlowNode
  x: number
  y: number
  width: number
  height: number
}

interface FlowConnection {
  fromId: string
  toId: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

interface FlowLayoutResult {
  nodes: FlowNode[]
  unions: FlowUnion[]
  connections: FlowConnection[]
  siblings: FlowNode[]
  orphans: string[]
  totalHeight: number
  totalWidth: number
}
```

---

## Rendu (SablierFlowView.tsx)

### Structure HTML

```
<div class="sablier-flow"> (scroll container)
  <div class="sablier-flow__canvas"> (sized to totalWidth x totalHeight)
    <svg class="sablier-flow__connections"> (z-index: 0)
      <line /> ... connexions
      <circle /> ... dots aux points d'attache
    </svg>

    <!-- Labels de génération -->
    <div class="sablier-flow__gen-label">Toi</div>
    <div class="sablier-flow__gen-label">Parents</div>
    ...

    <!-- Cards individuelles (fratrie, orphelins) -->
    <div class="sablier-flow__card" />

    <!-- Union groups -->
    <div class="sablier-flow__union">
      <span class="sablier-flow__union-label">💍 Union</span>
      <div class="sablier-flow__card" />
      <div class="sablier-flow__card" />
    </div>
  </div>
</div>
```

### Card personne

Chaque card affiche :
- **Initiales** dans un cercle coloré (bleu `#2563eb` homme, violet `#a855f7` femme)
- **Nom complet** en gras
- **Date de naissance** + statut (Vivant/†)
- **Badge rôle** en haut à droite si applicable (Père, Mère, Grand-père...)
- **État sélectionné** : border violet `#7c3aed` + shadow

### Connexions SVG

- **Lignes droites verticales** entre un parent et son enfant
- **Dots violets** (`#7c3aed`, r=4) au point de départ (bas de la card parent)
- **Dots gris** (`#d4d0cc`, r=3) au point d'arrivée (haut de la card enfant)
- La couche SVG est en `position: absolute`, `z-index: 0`, `pointer-events: none`
- Les cards sont en `z-index: 1`

### Interactions

- **Clic sur une card** → `selectPerson(id)` (ouvre le DetailPanel, recentre l'arbre)
- **Hover** → border plus visible, ombre renforcée
- **Scroll vertical** natif pour naviguer
- Pas de drag & drop, pas de zoom

### Empty state

Identique à l'actuel : message "Votre arbre vous attend" + bouton "+ Ajouter une personne".

---

## Styles (sablierFlow.css)

### Fond
- `background: #f8f8f6`
- Grille de points : `radial-gradient(circle, #e0ddd8 1px, transparent 1px)` en `20px 20px`

### Card
- `background: #ffffff`
- `border: 1.5px solid #e5e2dd`
- `border-radius: 12px`
- `padding: 14px 20px`
- `box-shadow: 0 1px 3px rgba(0,0,0,0.04)`
- Hover : `border-color: #c4c0ba`, shadow renforcée
- Sélection : `border-color: #7c3aed`, `box-shadow: 0 0 0 2px rgba(124,58,237,0.15)`

### Union group
- `border: 1.5px dashed #d4d0cc`
- `border-radius: 16px`
- `padding: 20px`
- `background: rgba(124,58,237,0.02)`
- Label 💍 en position absolute, `top: -10px`

### Labels de génération
- Positionnés à gauche du canvas
- Couleurs par niveau : violet (gen 0), bleu (gen 1), cyan (gen 2), vert (gen 3), ambre (gen 4)
- `font-size: 12px`, `font-weight: 600`

---

## Données

Utilise exactement les mêmes sources que l'ancien Sablier via `useTree()` :
- `persons` — liste des personnes
- `relationships` — toutes les relations
- `filteredRelationships` — relations filtrées par showFamily/showExtendedFamily
- `selectedPersonId` — personne sélectionnée
- `selectPerson(id)` — callback de sélection

Le rôle affiché dans le badge provient de `relationship.metadata.role` (ex: "Père", "Grand-mère").

---

## Tests

- Tests unitaires pour `sablierFlowLayout.ts` (réutiliser la logique des tests existants + nouveaux tests pour unions et connexions)
- Tests composant pour le rendu (empty state, clic sélection, affichage des cards)
