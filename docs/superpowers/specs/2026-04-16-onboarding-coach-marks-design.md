# Onboarding Coach Marks — Design Spec

**Date :** 2026-04-16
**Contexte :** Premier lancement de l'app Genealogy. L'utilisateur arrive via la landing « retrouver les biens oubliés » — il veut envoyer un formulaire, pas construire un arbre. L'onboarding doit lui faire construire un mini-arbre sans qu'il ait l'impression de faire un détour.

## Problème

L'app demande un investissement (ajouter des personnes dans l'arbre) avant le payoff (formulaire Cerfa pré-rempli). Sans onboarding, l'utilisateur arrive dans un arbre vide, ne comprend pas le lien arbre → formulaire, et décroche.

## Solution

Parcours guidé en 4 steps via coach marks (tooltips sombres) non-bloquants. Le « wow » arrive dès le step 2 : l'utilisateur voit le formulaire pré-rempli avec les données de l'ancêtre qu'il vient d'ajouter.

## Principes UX (Linear Method)

- **Momentum** : chaque step produit un résultat visible immédiat
- **Ambient UI** : les bulles apparaissent, guident, disparaissent — pas de checklist permanente
- **Fil conducteur** : chaque bulle explique le *pourquoi*, pas juste le *où cliquer*
- **Progressive disclosure** : le formulaire n'est montré qu'après la première personne (step 2)

## Parcours

### Step 1 — « Ajoutez votre premier ancêtre »

- **Déclencheur :** premier login, arbre vide (0 personnes)
- **Cible :** bouton « + Ajouter » dans la context bar
- **Visuel :** pulse violet sur le bouton + bulle coach mark en dessous
- **Contenu bulle :**
  - Badge `1 / 4`
  - Titre : « Ajoutez votre premier ancêtre »
  - Why : « Son nom pré-remplira automatiquement les formulaires de recherche foncière. »
  - CTA : « Ajouter → » (déclenche `openAddPerson`)
  - Lien discret : « Passer le guide »
- **Transition :** quand la PersonModal se ferme après création réussie → step 2

### Step 2 — « Le formulaire est déjà pré-rempli » ✨ (le wow)

- **Déclencheur :** première personne créée, visible dans Cosmos
- **Cible :** bouton « Recherches » dans la topbar
- **Visuel :** pulse violet sur « Recherches » + bulle coach mark avec aperçu formulaire inline
- **Contenu bulle :**
  - Badge `2 / 4`
  - Titre : « Le formulaire est déjà pré-rempli ✨ »
  - Why : « Cliquez sur Recherches pour voir le formulaire 3233 avec les données de {prénom}. »
  - Aperçu formulaire : mini-card avec 3 champs remplis (Nom, Prénoms, Naissance) extraits de la personne créée
  - CTA : « Voir le formulaire → » (déclenche ouverture du dropdown Recherches)
- **Transition :** quand l'utilisateur ouvre le dropdown OU ferme la bulle → step 3

### Step 3 — « Complétez votre arbre »

- **Déclencheur :** step 2 terminé
- **Cible :** bouton « + Ajouter » (à nouveau)
- **Visuel :** pulse violet + bulle coach mark
- **Contenu bulle :**
  - Badge `3 / 4`
  - Titre : « Complétez votre arbre »
  - Why : « Ajoutez le père ou la mère de {prénom}. Plus votre arbre est riche, plus vos recherches seront précises. »
  - CTA : « Ajouter quelqu'un → »
- **Note :** le flow créer → lier (déjà implémenté) s'enchaîne naturellement — après ajout, la modale propose de lier la personne
- **Transition :** quand une 2e personne est créée → step 4

### Step 4 — « Votre arbre est lancé 🎉 »

- **Déclencheur :** 2+ personnes dans l'arbre
- **Cible :** le nœud central dans Cosmos
- **Visuel :** bulle coach mark à côté du centre
- **Contenu bulle :**
  - Badge `4 / 4`
  - Titre : « Votre arbre est lancé 🎉 »
  - Why : « Cliquez sur n'importe qui pour lancer une recherche sur cette personne. Chaque ajout enrichit vos formulaires. »
  - CTA : « C'est parti ! »
- **Transition :** clic sur CTA → onboarding terminé, plus de bulles

## Composant `CoachMark`

### Props

```ts
interface CoachMarkProps {
  step: number
  totalSteps: number
  title: string
  description: string
  ctaLabel: string
  onCtaClick: () => void
  onSkip: () => void
  position: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode  // contenu custom (ex: aperçu formulaire)
}
```

### Visuel

- Fond `#1a1a1a`, texte blanc, border-radius 10px, shadow `0 8px 24px rgba(0,0,0,0.2)`
- Flèche triangulaire pointant vers la cible (CSS `::after` rotated square)
- Badge step : fond violet `#7c3aed`, texte `9px` bold
- CTA : bouton violet, « Passer le guide » en gris 50% à côté

### Animation pulse

```css
@keyframes coach-pulse {
  0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
  100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
}
```

Appliquée sur l'élément cible (pas la bulle) pour attirer l'attention.

## Orchestration — `useOnboarding` hook

### État

```ts
type OnboardingStep = 1 | 2 | 3 | 4 | 'done' | 'skipped'
```

- Persisté en `localStorage` clé `genealogy_onboarding_step`
- Initialisé à `1` si absent et arbre vide
- Initialisé à `'done'` si l'utilisateur a déjà des personnes au premier chargement

### Logique

```ts
function useOnboarding(personCount: number): {
  step: OnboardingStep
  advance: () => void
  skip: () => void
  isActive: boolean
}
```

- `advance()` : passe au step suivant (1→2→3→4→done)
- `skip()` : met `'skipped'`, plus de bulles
- `isActive` : `step !== 'done' && step !== 'skipped'`

### Transitions automatiques

- Step 1 → 2 : quand `personCount` passe de 0 à 1
- Step 3 → 4 : quand `personCount` passe de 1 à 2+
- Step 2 → 3 et step 4 → done : clic CTA bulle

### Reprise

Si l'utilisateur quitte l'app avant step 4, le guide reprend au bon step au prochain login (lu depuis localStorage).

## Placement dans l'app

Le hook `useOnboarding` est appelé dans `AppShell`. Les coach marks sont rendus conditionnellement selon le step actif :

- Steps 1, 3 : à côté du bouton « + Ajouter » dans la context bar
- Step 2 : à côté du bouton « Recherches » dans la topbar
- Step 4 : à côté du Cosmos center node (positionnement absolu dans le main area)

## Hors scope

- Onboarding pour le rôle VIEWER (pas de « + Ajouter »)
- Tutoriel des vues Sablier/Timeline/Carte
- Re-déclenchement du guide (pas de bouton « ? » en V1 — si skippé, c'est fini)
- Animations complexes entre steps (transition CSS simple suffit)

## Critères de succès

1. L'utilisateur crée sa première personne via le coach mark step 1
2. Il voit l'aperçu du formulaire pré-rempli au step 2 (le wow)
3. Il ajoute une 2e personne et la lie (step 3 + flow créer→lier)
4. Le guide se conclut naturellement au step 4
5. Un utilisateur existant (arbre non-vide) ne voit jamais le guide
6. « Passer le guide » fonctionne et persiste
7. La reprise après interruption fonctionne (localStorage)
