# UX Overhaul — Design Spec

*Date : 28 mars 2026*
*Statut : Validé*

---

## Contexte

Retours utilisateur après utilisation de l'app avec des données réelles (~20 personnes). Problèmes majeurs de lisibilité sur les vues Sablier et Timeline, ajustements visuels Cosmos, et fonctionnalités cassées ou à repenser.

---

## Section 1 — Bug fixes & polish rapide

### 1.1 Edges z-index Sablier
Les edges (liens) s'affichent par-dessus les nœuds (blocs personnes) dans la vue Sablier, rendant le schéma illisible. Le fix précédent (z-index 10 nœuds / 0 edges) n'a pas tenu. Investiguer la cause racine dans ReactFlow et corriger durablement.

### 1.2 Gestion des liens (DetailPanel)
La suppression et la modification des liens depuis le DetailPanel (boutons ✕ et ✎) ne fonctionnent plus. Diagnostiquer et corriger — cette feature avait été implémentée dans le Plan 10.

### 1.3 Filtres et rôles Sablier
Les filtres sidebar et les rôles ne fonctionnent pas dans la vue Sablier. Si le fix n'est pas trivial → masquer temporairement de l'UI plutôt que d'afficher des contrôles cassés.

### 1.4 Bouton "+ Ajouter"
Le bouton a un fond transparent qui le rend illisible sur le dégradé. Remplacer par un fond opaque avec un contraste suffisant.

### 1.5 Cosmos — texte nom de famille
La ligne "Nom · Année" sous le prénom est trop proche du cercle blanc (glow). Remonter le bloc texte de quelques pixels pour dégager l'espace.

### 1.6 Cosmos — orbites plus visibles
Les traits d'orbite sont trop fins et se perdent dans le dégradé de fond. Épaissir les traits et/ou augmenter leur opacité pour améliorer le contraste.

---

## Section 2 — Refonte Sablier

### 2.1 Layout vertical automatique par génération
Calculer la génération de chaque personne à partir des liens PARENT_CHILD :
- Génération 0 (utilisateur / personne la plus récente) → en bas
- Génération 1 (parents) → un cran au-dessus
- Génération 2 (grands-parents) → encore au-dessus
- etc.

Espacement horizontal automatique pour éviter les chevauchements au sein d'une même génération. Le drag & drop reste disponible pour ajuster manuellement.

### 2.2 Points d'attache dynamiques
Les edges se connectent au point le plus logique du bloc selon la position relative :
- Parent au-dessus → edge sort par le haut du bloc enfant, bas du bloc parent
- Conjoint à côté → edge sort par le côté
- Fratrie → edge horizontal

Remplace le comportement actuel où tous les points d'attache sont en haut du bloc.

### 2.3 Fond monochrome
Remplacer le dégradé pastel par un fond uni neutre (gris clair ou beige clair). Les edges gagnent en contraste et lisibilité.

---

## Section 3 — Refonte Timeline

### 3.1 Nouveau positionnement des individus
Répartir les personnes en rangées alternées (au-dessus / en-dessous de la frise) ou en swim lanes par génération pour éviter la superposition des noms. Un mockup HTML sera créé pour valider l'approche avant implémentation.

### 3.2 Dates lisibles
Espacer les labels de dates. Gérer les cas de dates proches ou identiques (regroupement, décalage vertical).

---

## Section 4 — Branches automatiques & Éventail

### 4.1 Détection automatique des branches
À partir des liens PARENT_CHILD et UNION existants, l'app détecte automatiquement les branches familiales (côté maternel, côté paternel, alliances). L'utilisateur n'a plus à les créer manuellement. Il peut renommer les branches ou ajuster les couleurs.

### 4.2 Éventail — masquer
Retirer l'onglet Éventail de la navigation. La feature sera repensée et réintroduite quand son utilité sera mieux définie.

---

## Ordre d'exécution

1. Section 1 — Bug fixes & polish rapide
2. Section 2 — Refonte Sablier
3. Section 3 — Refonte Timeline (mockup d'abord)
4. Section 4 — Branches auto + masquer Éventail
