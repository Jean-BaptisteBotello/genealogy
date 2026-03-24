# Spec : Vue Cosmos — Refonte visuelle (Plan 8)

*Date : 24 mars 2026*
*Statut : Validée*

---

## Contexte

La vue Cosmos existe déjà avec une implémentation SVG statique (nœuds colorés avec initiales, arêtes bezier, fond sombre). Cette spec décrit la refonte vers le design "Orbital Shadows" validé en mock-up : fond dégradé pastel, grain, glow central, nœuds orbitaux animés, ombres portées vers le centre, sans arêtes de relation.

---

## Objectif

Remplacer l'apparence de la vue Cosmos par le design validé en mock-up, en conservant la logique de sélection et d'interaction existante.

---

## Design visuel

### Fond

Dégradé CSS linéaire appliqué sur le conteneur `div` parent du SVG (pas dans le SVG lui-même) :
```css
background: linear-gradient(170deg, #b5c4d3 0%, #c4b8cf 45%, #c4909e 80%, #b07d8a 100%);
```

Grain canvas en `mix-blend-mode: overlay`, opacité 10%, dessiné une seule fois au montage dans un `useEffect(() => { drawGrain() }, [])`. Le canvas est positionné en `position: absolute; inset: 0; pointer-events: none`. Pas d'animation du grain.

**Détection décédé :** `person.date_deces !== null` est le seul signal. Pas de champ booléen séparé.

### SVG plein écran

Le SVG occupe `width: 100%; height: 100%` sans `viewBox` fixe. Le centre `(CX, CY)` est calculé dynamiquement comme `container.offsetWidth / 2` et `container.offsetHeight / 2`. Un `ResizeObserver` (ou `window resize`) recalcule `CX`/`CY` et reconstruit les cercles d'orbite. Les positions des nœuds sont recalculées à chaque frame de la boucle `rAF` depuis `(orbit, angle)`, donc le resize est géré automatiquement.

### Glow central

Dégradé radial SVG `<radialGradient id="centralGlow">` centré dynamiquement :
- 0% : `#ffffff` opacité 1
- 20% : `#f0e8f0` opacité 0.7
- 55% : `#d4b8c8` opacité 0.25
- 100% : `#c4909e` opacité 0

Appliqué sur un `<circle>` de rayon 200 centré sur `(CX, CY)`.

### Orbites

Cercles SVG concentriques, trait `rgba(80,45,65, α)`, épaisseur 0.6px. Le centre est l'orbite 0 (interne, non dessinée).

| Clé `ORBIT_RADII` | Rayon | Alpha du trait |
|---|---|---|
| 0 (centre) | 0 | — (pas de cercle dessiné) |
| 1 | 90 | 0.14 |
| 2 | 155 | 0.10 |
| 3 | 215 | 0.06 |
| 4 | 265 | 0.04 |
| 5 | 310 | 0.03 |

### Nœuds orbitaux

**Interface `PositionedNode` (mise à jour) :**
```typescript
export interface PositionedNode {
  id: string
  orbit: number       // 0 (centre) ou 1–5
  angle: number       // angle initial en radians
  // x et y sont supprimés — calculés à la volée dans le rAF loop
}
```

Les `x`/`y` absolus sont recalculés à chaque frame dans `CosmosView` :
```typescript
const x = CX + ORBIT_RADII[node.orbit] * Math.cos(node.angle)
const y = CY + ORBIT_RADII[node.orbit] * Math.sin(node.angle)
```

Vitesse angulaire par orbite (°/frame à 60fps, appliquée à `node.angle` dans le rAF loop) :

| Orbite | Vitesse |
|--------|---------|
| 1 | 0.16 |
| 2 | 0.12 |
| 3 | 0.09 |
| 4 | 0.07 |
| 5 | 0.05 |

Angle initial : distribué uniformément entre les nœuds d'une même orbite (`(2π * i) / count`).

**Mode monochrome (défaut) :**
- Vivant : cercle blanc plein `r=5`, filtre glow
- Décédé : cercle `fill=none`, `stroke rgba(140,100,120,0.6)`, `stroke-width=1`, `stroke-dasharray="2 2"`
- Label : `rgba(255,255,255,0.85)` / décédé `rgba(100,65,80,0.55)`

**Mode couleurs de branches (toggle) :**
- Vivant : cercle plein couleur de branche, filtre glow
- Décédé : cercle `fill=none`, stroke couleur de branche opacité 0.7, `stroke-dasharray="2.5 2"`
- Label : couleur de branche / décédé atténué

### Props de `CosmosNode`

```typescript
interface CosmosNodeProps {
  id: string
  x: number            // position absolue dans le SVG (calculée dans le rAF loop)
  y: number
  cx: number           // centre du SVG (CX), pour calculer la direction de l'ombre
  cy: number           // centre du SVG (CY)
  orbit: number        // 1–5, détermine la longueur de l'ombre
  prenom: string
  nom: string
  deceased: boolean
  mode: 'mono' | 'branch'
  branchColor: string  // couleur hex de la branche (ex: '#7c9cbf'), utilisée si mode='branch'
  isSelected: boolean
  onClick: (id: string) => void
  onHover: (id: string | null) => void
}
```

L'ombre est rendue **à l'intérieur de `CosmosNode`** dans le groupe `<g transform="translate(x,y)">`. Le composant calcule lui-même `dx`, `dy`, `dist` depuis `(cx, cy)` pour normaliser la direction.

### Nœud central (personne sélectionnée, orbite 0)

Rendu directement dans `CosmosView`, pas via `CosmosNode` :
- Cercle blanc `r=10` avec filtre glow, centré sur `(CX, CY)`
- Anneau extérieur `r=18`, `stroke rgba(255,255,255,0.35)`
- `<text>` : prénom, blanc, `font-size=11`, `font-weight=600`, `y = CY - 22`
- `<text>` : nom + année naissance, `rgba(255,255,255,0.55)`, `font-size=9`, `y = CY - 10`

### Ombre orbitale

Chaque nœud orbital projette une ligne depuis le nœud vers le centre. La ligne est recalculée à chaque frame solidairement avec la position du nœud.

**Formule des extrémités (dans le système de coordonnées du groupe `<g>` translaté) :**
```
x1=0, y1=0   (position du nœud = origine du groupe)
dx = CX - nodeX  (direction vers le centre)
dy = CY - nodeY
dist = sqrt(dx² + dy²)
length = 24 + (5 - orbit) * 6   // orbite 1 → 30px, orbite 5 → 6px
x2 = (dx/dist) * length
y2 = (dy/dist) * length
```

- Couleur : `rgba(80,45,65,0.45)`
- Épaisseur : 1.2px vivant, 1px décédé
- `stroke-linecap: round`

### Arêtes de relation

**Supprimées.** `CosmosEdge` n'est plus importé ni rendu. Le fichier `CosmosEdge.tsx` peut rester dans le repo (non importé).

---

## Hiérarchie des orbites

### Extraction du rôle

```typescript
function getMetadataRole(rel: Relationship): string | undefined {
  const meta = rel.metadata as { role?: unknown }
  return typeof meta?.role === 'string' ? meta.role : undefined
}
```

### Convention de direction

Dans la table `relationship` :
- `PARENT_CHILD` : `person_a_id` = parent, `person_b_id` = enfant
- `ADOPTION` : `person_a_id` = parent adoptif, `person_b_id` = enfant adopté
- `STEP` : `person_a_id` = beau-parent, `person_b_id` = bel-enfant
- `UNION`, `SIBLING`, `HALF_SIBLING` : pas de hiérarchie directionnelle

`isPersonA = (rel.person_a_id === centerId)` — vrai si la personne centrale est dans la colonne `person_a_id`.

### Fonction `getOrbitForRole`

```typescript
export function getOrbitForRole(
  role: string | undefined,
  type: RelationshipType,
  isPersonA: boolean
): number
```

Mapping prioritaire (role d'abord, fallback type ensuite) :

| Orbite | Rôles `metadata.role` | Fallback `type` + direction |
|--------|----------------------|----------------------------|
| 1 | `père`, `mère`, `beau-père`, `belle-mère` | `STEP` avec `isPersonA=false` (centre = bel-enfant) |
| 2 | `époux/épouse`, `fils`, `fille`, `enfant adopté(e)` | `UNION` ; `PARENT_CHILD` avec `isPersonA=true` (centre = parent) ; `ADOPTION` avec `isPersonA=true` |
| 3 | `frère`, `sœur`, `demi-frère`, `demi-sœur`, `grand-père`, `grand-mère` | `SIBLING`, `HALF_SIBLING` ; `PARENT_CHILD` avec `isPersonA=false` (centre = enfant, donc l'autre est parent) |
| 4 | `oncle`, `tante`, `cousin`, `cousine` | `STEP` avec `isPersonA=true` ; `ADOPTION` avec `isPersonA=false` |
| 5 | `arrière-grand-père`, `arrière-grand-mère`, `arrière-arrière-grand-père`, `arrière-arrière-grand-mère` | Tous les cas non couverts ci-dessus → **5 par défaut** |

> **Note grand-parents sans `metadata.role`** : un lien `PARENT_CHILD` sans rôle où `isPersonA=false` signifie que l'autre personne est parent du centre — elle atterrit en orbite 3 (même orbite que `grand-père`/`grand-mère` avec rôle). Ce n'est pas sémantiquement parfait (un parent direct a aussi `isPersonA=false`) mais les parents directs auront quasi-systématiquement `metadata.role = 'père'/'mère'` grâce à la feature LinkPersonForm. Le fallback orbite 3 est acceptable pour les liens sans rôle.

---

## Interactions

### Clic sur un nœud
Appelle `selectPerson(id)` — recentre la vue sur la nouvelle personne. La liste des nœuds est recalculée depuis `computeCosmosLayout`.

### Survol
Tooltip `<div>` absolu (fond `rgba(255,245,250,0.88)`, `backdrop-filter: blur(8px)`) positionné via `mousemove`. Props de `CosmosTooltip` mises à jour :

```typescript
interface CosmosTooltipProps {
  person: Person
  x: number          // position absolue dans le conteneur (calculée dans le rAF loop)
  y: number
  role: string       // metadata.role ou RELATION_LABEL[type] ou type brut
}
```

`CosmosView` maintient un `Map<string, string>` (personId → rôle résolu) construit lors du layout pour alimenter le tooltip.

### Toggle "Couleurs de branches"

- `<div>` positionné en `position: absolute; top: 16px; left: 50%; transform: translateX(-50%); z-index: 10`
- **À l'intérieur du conteneur relatif** de `CosmosView`, pas dans le SVG
- État : `useState<boolean>` initialisé depuis `localStorage.getItem('cosmos_branch_colors') === 'true'`
- Au toggle : `localStorage.setItem('cosmos_branch_colors', String(next))`
- Transition CSS sur fill/stroke des nœuds : `transition: fill 0.3s, stroke 0.3s`

### Orphelins

Badge existant conservé : `position: absolute; bottom: 16px; right: 16px`. Couleurs adaptées au thème clair : fond `rgba(180,120,140,0.2)`, texte `rgba(100,65,80,0.7)`.

---

## Cleanup

`CosmosView` doit annuler la boucle `rAF` et le `ResizeObserver` au démontage :

```typescript
// CX et CY sont des refs, PAS du state, pour éviter les stale closures dans le rAF loop
const cxRef = useRef(0)
const cyRef = useRef(0)

useEffect(() => {
  let rafId: number
  const observer = new ResizeObserver(() => {
    // Mise à jour directe des refs — pas de re-render
    cxRef.current = containerRef.current!.offsetWidth / 2
    cyRef.current = containerRef.current!.offsetHeight / 2
    // Reconstruire les cercles d'orbite (manipulation SVG directe)
    rebuildOrbitRings()
  })
  observer.observe(containerRef.current!)
  // Init
  cxRef.current = containerRef.current!.offsetWidth / 2
  cyRef.current = containerRef.current!.offsetHeight / 2

  function tick(ts: number) {
    // Lit cxRef.current / cyRef.current — toujours à jour
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(rafId)
    observer.disconnect()
  }
}, [nodes])  // re-run quand les nœuds changent (nouvelle sélection)
```

---

## Composants à créer / modifier

| Fichier | Action | Résumé |
|---------|--------|--------|
| `src/components/cosmos/cosmosLayout.ts` | Modifier | Remplacer BFS par `getOrbitForRole`, `ORBIT_RADII` étendu à 6 clés (0–5), `PositionedNode` sans x/y |
| `src/components/cosmos/CosmosView.tsx` | Modifier | SVG plein écran, rAF loop, canvas grain, toggle, cleanup |
| `src/components/cosmos/CosmosNode.tsx` | Modifier | Plus d'initiales, prop `mode` + `branchColor` + shadow props, rendu ombre + cercle |
| `src/components/cosmos/CosmosTooltip.tsx` | Modifier | Nouveau thème clair, prop `role` ajoutée |
| `src/components/cosmos/CosmosEdge.tsx` | Conserver | Non importé, laissé en place |

---

## Tests

- **Unit** : `getOrbitForRole` — tous les rôles du tableau, fallbacks par type, cas non couvert → 5
- **Unit** : `getMetadataRole` — string valide, undefined, nombre, null
- **Unit** : `computeCosmosLayout` — angles uniformément distribués, centre orbit 0, orphelins corrects
- **Component** : `CosmosView` — nœud central rendu, toggle visible, badge orphelins présent
- **Component** : `CosmosNode` — mode mono vs branch, cercle pointillés si décédé
- **Component** : `CosmosTooltip` — affiche nom, année, rôle

---

## Hors périmètre

- Transition animée lors du recentrage (clic sur un nœud)
- Contrôle de vitesse d'animation
- Zoom / pan
