# Landing Page — Design Spec

**Date :** 2026-04-09
**Auteur :** Pierre Dupont (avec assistance Claude Code)
**Statut :** En attente de revue

---

## 1. Contexte et objectif

### Pourquoi cette landing page

Genealogy est une application web de généalogie collaborative qui inclut depuis fin mars 2026 une feature **recherche foncière** : digitalisation des formulaires Cerfa **3233-SD** (demande de renseignements) et **3236-SD** (copies de documents fonciers) édités par les **Services de Publicité Foncière (SPF)**.

Ces formulaires officiels ne sont à ce jour pas digitalisés au-delà du PDF téléchargeable, et leur complétion manuelle est lourde (recopie des mêmes informations sur plusieurs lignes, codes administratifs obscurs, choix du SPF compétent parmi 100). Cette friction explique pourquoi très peu de familles entreprennent ces démarches — alors qu'elles permettent de retrouver des **biens immobiliers oubliés** ou des informations sur des **ancêtres**.

La landing page a donc deux objectifs imbriqués :

1. **Présentation publique** du produit Genealogy avec un angle d'entrée commercial clair sur la digitalisation des formulaires SPF.
2. **Constitution d'une waitlist** d'utilisateurs intéressés, en attendant que la feature soit prête pour une mise en production grand public.

L'audience est **hybride** :
- Le grand public curieux qui ne sait pas que ces formulaires existent (entrée par "biens oubliés")
- Les chercheurs en généalogie amateurs qui connaissent la galère des formulaires papier

L'angle d'entrée principal — *« retrouver les biens oubliés de votre famille »* — fonctionne pour les deux audiences : il est suffisamment accrocheur pour intéresser un visiteur découvrant le sujet, et suffisamment précis pour résonner chez un généalogiste qui a déjà touché du doigt ces démarches.

### Ce qui n'est PAS l'objectif

- ❌ Vendre directement (pas de paiement, pas de tarification annoncée)
- ❌ Convertir vers une création de compte immédiate (le SSO Google n'est pas en place — c'est une feature v2)
- ❌ Présenter l'app de généalogie elle-même (cosmos, sablier flow, timeline) qui sortira plus tard
- ❌ Remplacer la documentation produit existante

### Décisions structurantes (déjà prises avec JB)

1. **Pas de chiffres exagérés** : on n'écrit pas "3 minutes au lieu de 2 heures". On reste sur des registres descriptifs ("pré-rempli depuis votre arbre · guidé pas à pas · envoyé sans imprimer") plutôt que des promesses chiffrées non vérifiables.
2. **Pas de "vacant"** : on parle de *biens oubliés*, *biens méconnus*, jamais de *biens vacants* (qui a un sens juridique précis).
3. **Sources officielles citées** : le copy s'appuie sur des affirmations vérifiables, et les sources sont visibles sur la page (strip sous la FAQ + colonne dans le footer).
4. **Pattern friction minimale** : la waitlist se fait avec un email seul. La collecte d'attendus utilisateurs est prévue **post-submit** sur une page de remerciement (hors scope de cette spec — voir parking lot).

---

## 2. Identité visuelle et design system

### Palette (Warm Light, déjà en place dans Genealogy)

| Token | Valeur | Usage |
|---|---|---|
| `--cream` | `#f4f1ea` | Fond principal des sections crème |
| `--cream-deep` | `#e6dfcf` | Fond du CTA final (break visuel chaud) |
| `--ink` | `#1a1815` | Texte principal, bouton primaire |
| `--ink-soft` | `#4a4641` | Texte secondaire, lede |
| `--violet` | `#7c3aed` | Accent unique : italiques, dots, badges, glow |
| `--violet-soft` | `#ede9fe` | Backgrounds badge, fields pré-remplis |
| Texture | `radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px) 22px 22px` | Trame de points subtile sur tous les fonds crème |

> **Note :** ces tokens étendent légèrement le design system existant (`--cream-deep` est nouveau, et `#f4f1ea` est légèrement plus chaud que le `#f8f8f6` actuel des composants in-app). L'écart est volontaire pour donner à la landing une identité éditoriale distincte de l'app, tout en restant dans la même famille warm light.

### Typographie

| Famille | Source | Usage |
|---|---|---|
| **Instrument Serif** (régulier + italique) | Google Fonts | Titres, eyebrows en italique, accents éditoriaux, brand mark |
| **Inter** (400, 500, 600) | Google Fonts | Corps de texte, navigation, labels, formulaires |

L'italique violet d'Instrument Serif est l'élément signature de la page : utilisé sur les mots-clés (*oublié*, *épuisante*, *récupération*, *premiers à savoir*…) il porte l'identité éditoriale de la landing.

### Système de grille et espacement

- Largeur max : `1180px` centrée
- Padding horizontal section : `56px`
- Padding vertical section : `80px` haut, `88px` bas
- Gap entre sections : marge naturelle, fond beige extérieur (`#d9d4c9`) qui montre la séparation
- Border-radius des sections : `14px`
- Box-shadow des sections : `0 30px 80px -30px rgba(0,0,0,.18)` pour soulever les blocs

### Composants visuels récurrents

- **Eyebrow** : pill blanc translucide avec dot violet, label uppercase tracking large
- **H2 de section** : Instrument Serif 64px, line-height 0.96, italique violet sur le mot-clé
- **Lede** : Inter 16px, max-width 440px, ink-soft
- **Cards blanches** : bordure rgba(0,0,0,.06), shadow douce, padding 28px
- **Numéros romains italiques** (i. ii. iii.) en violet, Instrument Serif italique, comme paginateur des cards
- **Footnote de section** : Instrument Serif italique 22px centré, accent violet sur partie du texte

---

## 3. Architecture de la page

### Structure (6 sections) — confirmée par JB

```
1. Hero
2. Problème          ← agitation
3. Comment ça marche ← solution
4. Formulaires       ← preuves / crédibilité
5. FAQ              ← levée d'objections + sources
6. CTA final + footer
```

Lecture : *promesse → problème → solution → preuves → freins levés → action*

### Routing Next.js

- **Route :** `/` — la landing page **remplace** la redirection actuelle `redirect('/tree')` dans `src/app/page.tsx`
- L'app authentifiée reste accessible via `/tree` (et les autres routes existantes)
- Pas de middleware ou de detection : la landing est publique, l'accès à l'app nécessite toujours l'auth Supabase existante

> **À l'implémentation :** vérifier qu'il n'y a pas de side-effect SEO/analytics sur l'ancien comportement de `/`.

---

## 4. Sections détaillées

### Section 1 — Hero

**Layout :** topbar + hero asymétrique 2 colonnes (1.35fr / 1fr), grille de points subtile en fond.

**Topbar :**
- Brand : `Genealogy` en Instrument Serif 24px avec point violet final (`Genealogy.`)
- Nav : "Comment ça marche", "Les formulaires", "FAQ"
- CTA secondaire : `Rejoindre la waitlist →` (pill blanc bordé ink)

**Colonne gauche (1.35fr) :**
- Eyebrow : `● Recherche foncière digitalisée`
- H1 (Instrument Serif 92px, line-height 0.92) :
  ```
  Et si votre famille
  avait *oublié*
  un bien ?
  ```
  → `oublié` en italique violet
- Lede (17px ink-soft, max-width 480px) :
  > « Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour vous aider à retrouver les biens immobiliers de votre famille — et leurs anciens propriétaires. »
- Form pill blanc : `[email] [Rejoindre la waitlist]` (max 440px)
- Form-meta sous la pill : `Pré-rempli depuis votre arbre · Guidé pas à pas · Envoyé sans imprimer`

**Colonne droite (1fr) — preview animé :**
- Card blanche très légèrement inclinée (`rotate(-1.4deg)`), shadow douce + halo violet subtil
- Header : `Cerfa 3233 — Demande de renseignements` (Instrument Serif 22px) + badge "Pré-rempli" violet-soft
- 4 fields :
  - **Demandeur** (animé)
  - **Personne recherchée** (animé)
  - **Immeuble** (animé)
  - **Période de délivrance** (statique : *« depuis le 1er janvier 1956 »*)
- Footer card : `✓ Prêt à envoyer` (violet) à gauche, pill noire `Envoyer au SPF` à droite

**Animation typewriter (cf. section 7 — Composants) :**
- Cycle sur 4 sets fictifs (Dupont/Marseille, Duval/Lyon, Lefebvre/Roubaix, Martin/Bordeaux)
- Chaque set : type Demandeur → 180ms → type Personne → 180ms → type Immeuble → 3000ms pause → erase Immeuble → erase Personne → erase Demandeur → 250ms → set suivant
- Vitesse type ~28ms ± 30ms jitter, vitesse erase ~14ms
- Curseur violet `1px` clignotant pendant l'écriture

**Footnote bandeau bas du hero :**
`Données officielles SPF · 100 services de publicité foncière couverts · RGPD — Hébergement EU`

---

### Section 2 — Le problème

**Header section (2 colonnes asymétriques) :**
- Eyebrow violet : `● Le problème`
- H2 :
  ```
  Une démarche
  *épuisante*,
  conçue pour 1980.
  ```
- Lede : *« Aujourd'hui, demander un renseignement au Service de Publicité Foncière suppose de comprendre un formulaire administratif, de retrouver le bon service parmi cent, et d'attendre des mois. La plupart des familles n'essayent jamais. »*

> ⚠️ **Note copy :** la phrase *« attendre des mois »* dans le lede contredit Q5 de la FAQ (10 jours en théorie). À reformuler en *« attendre une réponse sans suivi »* ou *« et accepter d'attendre »*. À fixer pendant l'implémentation.

**3 cards "douleurs" :**

#### Pain i — Champs répétitifs
- Visuel : 3 pages froissées superposées + cachet "CERFA 3233" inclinée violet
- H3 : *« Des dizaines de champs identiques, à recopier à la main. »*
- Body : *« Le même nom, la même adresse, les mêmes dates répétés sur chaque ligne — et à chaque demande. Une seule faute de frappe, et tout est à refaire. »*
- Tag : `Cerfa 3233 / 3236`

#### Pain ii — Trouver le bon SPF
- Visuel : carte de France grille avec pins gris dispersés et un pin violet central + label "SPF Marseille 2" + grand point d'interrogation italique en filigrane violet
- H3 : *« Trouver le bon service parmi 100 SPF en France. »*
- Body : *« Chaque commune dépend d'un Service de Publicité Foncière différent. Se tromper d'adresse, c'est 6 semaines de perdues — quand on a même une réponse. »*
- Tag : `100 services en France`

#### Pain iii — Canal d'envoi et attente
- Visuel : grille calendrier mensuel + arrow violet bas avec label "délai variable"
- H3 : *« Trouver le bon canal d'envoi, et attendre sans suivi. »*
- Body : *« Messagerie sécurisée impots.gouv, courriel direct au SPF, courrier en deux exemplaires… selon le cas. Pas d'accusé de réception, pas de suivi : la réponse arrive en quelques jours — ou plusieurs semaines. »*
- Tag : `10 jours en théorie · variable en pratique`

**Footnote section :**
*« Et c'est exactement pour ça que **presque personne ne le fait**. »*

---

### Section 3 — Comment ça marche

**Header section :**
- Eyebrow : `● La solution`
- H2 :
  ```
  Trois étapes,
  aucune *recopie*,
  un seul envoi.
  ```
- Lede : *« Genealogy connecte votre arbre familial aux formulaires officiels du Service de Publicité Foncière. Vous choisissez qui chercher — on s'occupe du reste. »*

**3 cards "étapes" :**

#### Étape i — Construire l'arbre
- Visuel : SVG mini-arbre 5 nœuds (Marie + Henri → Antoine → Vous + Sœur), nœud "Vous" highlight violet, lien "Antoine→Vous" highlight violet
- H3 : *« Construisez ou importez votre arbre. »*
- Body : *« Ajoutez vos parents, grands-parents, ancêtres directs ou cousins. Un arbre minimal suffit pour commencer une recherche. »*
- Tag : `Étape 1 · Votre famille`

#### Étape ii — Pré-remplissage
- Visuel : 5 barres de progression colorées (alternance violet plein et violet-soft) + flèche italique serif "↳" à gauche
- H3 : *« Choisissez qui chercher. On remplit le formulaire. »*
- Body : *« Sélectionnez un ancêtre dans votre arbre. Genealogy reprend automatiquement les noms, dates et lieux dans le bon Cerfa, dans les bons formats. »*
- Tag : `Étape 2 · Pré-remplissage`

#### Étape iii — Envoi
- Visuel : enveloppe blanche inclinée + check ✓ violet en pastille + mini pin "📍 SPF Marseille 2" + swoosh violet horizontal
- H3 : *« Envoyez au bon SPF, en un clic. »*
- Body : *« Genealogy identifie automatiquement le Service de Publicité Foncière compétent selon la commune, et transmet votre demande. »*
- Tag : `Étape 3 · Envoi`

**Footnote section :**
*« Et vous récupérez la réponse **directement dans votre boîte mail**. »*

---

### Section 4 — Les formulaires couverts

**Header section :**
- Eyebrow : `● Les formulaires`
- H2 :
  ```
  Les deux Cerfa
  officiels du *SPF*,
  digitalisés.
  ```
- Lede : *« Genealogy reprend les deux formulaires utilisés par les Services de Publicité Foncière pour rechercher des biens et obtenir les copies des actes — sans en modifier la valeur juridique. »*

**2 cards "formulaires" (grid 1fr 1fr, gap 32px) :**

Chaque card a :
- Liseré violet 4px en haut
- Header : numéro Cerfa en Instrument Serif 56px (`3233` / `3236`) + sous-titre `Cerfa SD` + badge `Officiel` violet-soft
- Nom italique 26px (*« Demande de renseignements »* / *« Copies de documents fonciers »*)
- Description (14px ink-soft)
- Encart `À utiliser quand` sur fond crème
- Liste de chips des blocs couverts
- Footer : prix italique + label "Tarif officiel SPF"

#### Card 3233
- Description : *« Le formulaire de recherche : permet d'identifier les biens immobiliers liés à une personne ou à un immeuble, à partir du 1er janvier 1956. »*
- À utiliser quand : *« Vous cherchez à savoir quels biens un ancêtre a possédés, ou qui est propriétaire d'une parcelle. »*
- Chips : `Personnes recherchées` `Désignation d'immeubles` `Période de délivrance` `Coût et facturation` `Mode de paiement`
- Prix : *« à partir de **12 €** »*

#### Card 3236
- Description : *« Le formulaire de récupération : une fois les références d'un acte connues, il permet d'obtenir la copie du document d'origine au SPF. »*
- À utiliser quand : *« Vous avez les références d'un acte (volume, numéro) et souhaitez obtenir sa copie officielle. »*
- Chips : `Nature du document` `Date de formalité` `N° SAGES / SPF` `Volume & numéro` `Coût et facturation`
- Prix : *« à partir de **6 €** »*

**Footnote section :**
*« 100 services de publicité foncière couverts — **l'ensemble du territoire**. »*

---

### Section 5 — FAQ

**Header section :**
- Eyebrow : `● Questions fréquentes`
- H2 :
  ```
  Tout ce que vous
  vous demandez
  *avant d'essayer*.
  ```
- Lede : *« Quelques précisions sur la légalité, les coûts, vos données, et ce qui se passe après l'envoi. »*

**6 questions** (max-width 820px centré, format Q sur la gauche, numéro romain italique violet à droite) :

1. **Est-ce que c'est *légal* de demander ces informations ?**
   → Oui. Les Cerfa 3233 et 3236 sont des formulaires officiels accessibles à **toute personne**, sans justification de lien familial. Le Service de Publicité Foncière est un service public ouvert.

2. **Combien ça coûte au total ?**
   → Le tarif officiel du SPF s'applique : **12 € par recherche** (formulaire 3233) et **6 € par bordereau** (formulaire 3236). Genealogy ne prélève pas de commission sur ces tarifs administratifs ; le prix de l'abonnement sera communiqué au lancement.

3. **Et mes données familiales ?**
   → Vos données sont stockées en Europe, hébergées en Allemagne (Frankfurt), conformes **RGPD**. Les documents PDF que vous générez sont accessibles via des liens signés à durée limitée. Vous gardez la propriété et le contrôle de vos contenus.

4. **Je n'ai pas encore d'arbre généalogique. Je peux quand même utiliser Genealogy ?**
   → Oui. Vous pouvez créer un arbre minimal directement dans l'app — il suffit d'**une seule personne** pour lancer une recherche. Les liens familiaux peuvent être ajoutés au fur et à mesure que vous obtenez des informations.

5. **Que se passe-t-il après l'envoi au SPF ?**
   → Le service de publicité foncière reçoit votre demande et vous répond directement, par courrier ou par courriel selon votre choix. Le délai légal est de **10 jours** ; en pratique il oscille entre **quelques jours et plusieurs semaines** selon la charge du SPF concerné. Genealogy garde une trace de vos demandes pour vous éviter les doublons.

6. **Quand est prévu le lancement ?**
   → Genealogy est en développement actif. Les inscrits à la waitlist seront prévenus en avant-première — et invités à tester l'outil avant tout le monde.

**Footnote :** *« Une autre question ? **Écrivez-nous**. »* (lien `mailto:` ou anchor)

**Strip "Sources officielles" sous la footnote** (border-top dashed, font 11px, label violet uppercase) :
```
SOURCES OFFICIELLES
service-public.gouv.fr — Comment obtenir des renseignements immobiliers ?
·
impots.gouv.fr — Cerfa 3236-SD
```

---

### Section 6 — CTA final + footer

#### CTA bloc

- **Fond crème sépia** `#e6dfcf` (un cran plus profond que les autres sections, break visuel chaud)
- Trame de points subtile en overlay
- Halo violet radial doux derrière le titre (rgba(124,58,237,.18))
- Padding `96px 56px 88px`, contenu centré

**Contenu :**
- Eyebrow : `● Rejoindre la waitlist`
- H2 (Instrument Serif 84px, line-height 0.94, max-width 920px) :
  ```
  Et si vous étiez
  les *premiers à savoir*
  ce que votre famille a oublié ?
  ```
- Lede : *« Genealogy ouvrira en avant-première aux inscrits de la waitlist. Pas de spam, juste une notification quand ce sera prêt. »*
- Form pill blanc (480px max) : `[email] [Rejoindre la waitlist]` — bouton ink
- Meta sous la form : `Vous serez prévenu·e dès l'ouverture · **Pas de carte bancaire requise**`

**3 chiffres-preuves** (Instrument Serif italique, séparateurs verticaux fins) :
- **2** formulaires officiels
- **100** SPF couverts
- **1956** depuis cette année

#### Footer

- Fond crème classique
- Grid 4 colonnes (`2fr 1fr 1fr 1fr`) :
  - **Brand** : `Genealogy.` (Serif 36px) + tagline italique *« Retrouvez les biens oubliés de votre famille — sans recopier un seul champ. »*
  - **Produit** : Comment ça marche, Les formulaires, FAQ, Roadmap
  - **Sources officielles** :
    - service-public.gouv.fr — Renseignements immobiliers
    - impots.gouv.fr — Cerfa 3236-SD
    - service-public.gouv.fr — Cerfa 3233-SD (R47483)
  - **Légal** : Mentions légales, Politique de confidentialité, CGU, RGPD
- **Footer-bottom** (border-top, 3 zones) :
  - Gauche : `© 2026 Genealogy · Hébergé en Allemagne (Frankfurt) · RGPD`
  - Centre : `contact@genealogy.fr · Twitter`
  - Droite : *« Fait avec soin en France · »* (italique)

---

## 5. Sources officielles utilisées

Toutes les affirmations chiffrées ou juridiques de la landing s'appuient sur ces sources publiques vérifiées le 2026-04-09 :

| Source | URL | Affirmations couvertes |
|---|---|---|
| service-public.gouv.fr — Comment obtenir des renseignements immobiliers ? (F17759) | https://www.service-public.gouv.fr/particuliers/vosdroits/F17759 | Toute personne peut faire la demande ; délai légal 10 jours ; envoi par courriel possible |
| service-public.gouv.fr — Renseignements situation juridique immeubles (R47483) | https://www.service-public.gouv.fr/particuliers/vosdroits/R47483 | Cerfa 3233-SD ; usage et conditions |
| service-public.fr — Copie de documents (R47480) | https://www.service-public.fr/particuliers/vosdroits/R47480 | Cerfa 3236-SD ; usage |
| impots.gouv.fr — Formulaire n°3236-SD | https://www.impots.gouv.fr/formulaire/3236-sd/demande-de-copie-de-documents-pour-la-periode-compter-du-1er-janvier-1956 | Tarifs 3236 (6 € bordereau, 30 € EDDC, 15 € autre) |
| Formulaire 3236-SD édition 2026 (PDF officiel) | https://www.impots.gouv.fr/sites/default/files/formulaires/3236-sd/2026/3236-sd_5445.pdf | Structure complète et tarifs |
| Service de la publicité foncière — Services Publics + | https://www.plus.transformation.gouv.fr/experiences/7042701_service-de-la-publicite-fonciere | Délai pratique (5-15 jours, parfois plusieurs semaines) |
| Notice tarifaire 3241-NOT-SD | référencée par 3236-SD | Détail des tarifs SPF (à intégrer si besoin de précisions) |

---

## 6. Stack technique

### Cohérence avec l'app

La landing reste dans la même app Next.js que Genealogy — pas de site séparé, pas de Vercel à part. Stack inchangée :

- Next.js 14+ App Router (cf. AGENTS.md : *« This is NOT the Next.js you know »* — vérifier `node_modules/next/dist/docs/` avant tout choix d'API)
- TypeScript
- Tailwind CSS (classes utilitaires + tokens custom pour la palette landing)
- Composants React server-rendered avec un seul îlot client pour le typewriter et la soumission de waitlist

### Routes et fichiers attendus

```
src/app/
├── page.tsx                    [REMPLACÉ] → rend <Landing />
├── (landing)/
│   ├── layout.tsx              optionnel — layout sans Topbar app
│   ├── components/
│   │   ├── LandingTopbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HeroFormPreview.tsx     ← contient le client typewriter
│   │   ├── ProblemSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── FormsSection.tsx
│   │   ├── FaqSection.tsx
│   │   ├── CtaSection.tsx
│   │   └── LandingFooter.tsx
│   └── lib/
│       └── waitlist-action.ts      ← server action POST email
└── waitlist/
    └── thanks/
        └── page.tsx                ← page de remerciement post-submit (parking lot)
```

### Polices

Charger via `next/font/google` (Instrument Serif + Inter) au niveau de `(landing)/layout.tsx` ou directement dans `page.tsx` pour ne pas peser sur les autres routes de l'app.

### Tokens couleur

Étendre `tailwind.config` avec un namespace `landing` :

```js
landing: {
  cream: '#f4f1ea',
  'cream-deep': '#e6dfcf',
  ink: '#1a1815',
  'ink-soft': '#4a4641',
  violet: '#7c3aed',
  'violet-soft': '#ede9fe',
}
```

Ces tokens ne touchent pas le design system existant `theme-context.tsx` de l'app authentifiée.

### Stockage des emails waitlist

Server action qui insère dans une nouvelle table Supabase `waitlist_signups` :

```sql
create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text default 'landing-hero',
  created_at timestamptz default now()
);
create unique index on waitlist_signups (lower(email));
```

- RLS : insertion publique uniquement (anyone can insert), lecture restreinte aux admins
- `source` permet de différencier hero vs CTA final si besoin de mesurer

### Animation typewriter

- Composant client `<HeroFormPreview />` avec un hook `useTypewriterCycle(examples)`
- 4 sets fictifs définis dans le composant (pas de fetch, statique)
- Vitesses : type ~28ms ± 30ms jitter, erase ~14ms, pause plein 3000ms, pause set 250ms
- Caret violet 1px clignotant (CSS animation steps(1))
- Respecte `prefers-reduced-motion` : si l'utilisateur a activé l'option système, on affiche le 1er set en static sans animation.

### Accessibilité

- Form pill : input avec `<label>` visuellement masqué (`sr-only`)
- Caret typewriter : `aria-hidden="true"`
- Animation typewriter : désactivée si `prefers-reduced-motion: reduce`
- Headings : un seul `<h1>` (le hero), reste en `<h2>` puis `<h3>` dans les cards
- Liens externes (sources) : `target="_blank" rel="noopener"`
- Contraste : tous les textes ink/ink-soft sur cream passent AAA ; vérifier les liens violet sur sépia (Pain #2 strip)

### SEO basique

- `<title>` : `Genealogy — Retrouvez les biens oubliés de votre famille`
- `<meta name="description">` : la phrase du lede du hero
- Open Graph : image générée à partir du H1 (à fournir en `public/og.png`, hors scope code)
- Pas de sitemap dynamique nécessaire (1 seule page)

---

## 7. Composants visuels sur-mesure

Voici les blocs SVG/CSS à construire from scratch (pas de lib externe) :

| Composant | Section | Détail |
|---|---|---|
| **Form preview Cerfa 3233 stylisé** | Hero | Card blanche inclinée, 4 fields dont 3 animés, footer pill ink |
| **Pile de pages Cerfa froissées** | Pain #1 | 3 div positionnées absolutely, rotations légères, pseudo-éléments pour les lignes de contenu, cachet violet inclined |
| **Mini carte de France SPF** | Pain #2 | Background grille, 5 pins absolute (1 violet target, 4 gris), label tooltip ink, point d'interrogation italique en filigrane |
| **Calendrier mensuel + arrow** | Pain #3 | 4 rangées de 7 jours, état "passed/now/empty", arrow gradient horizontal avec label "délai variable" |
| **SVG mini-arbre 5 nœuds** | Étape #1 | viewBox 240×130, 2 parents → 1 enfant → 2 enfants, lien et nœud highlight violet sur "Vous" |
| **Form-fill barres animées** | Étape #2 | 5 div barres avec width fixe via classes (r1=92%, r2=78%, r3=66%, r4=84%, r5=50%), arrow italique "↳" |
| **Enveloppe + check** | Étape #3 | Div bordée ink avec triangle clip-path pour le rabat, pseudo après pour le check violet, mini pin label ink |

Tous ces composants peuvent vivre dans `(landing)/components/visuals/` comme petits sous-composants présentationnels purs.

---

## 8. Décisions parking lot (V2 / hors scope de cette spec)

Ces points sont **identifiés** mais explicitement **hors scope** de cette spec. Ils ouvrent des specs ou tickets séparés :

1. **SSO Google** — l'authentification réelle sera ajoutée plus tard. La landing v1 fonctionne sans : seule la waitlist email est en place.

2. **Page de remerciement post-submit** (`/waitlist/thanks`) — design et copy à valider séparément. Pattern minimal : titre "Merci !", textarea optionnel *« Que cherchez-vous à retrouver ? Une dernière question pour nous aider à construire l'outil. »*, bouton "Terminer". Cette collecte d'attendus est l'apport user research promis à JB.

3. **Brand name définitif** — "Genealogy" reste un placeholder. Si un nom commercial est choisi avant la mise en ligne, faire un find/replace sur la landing (le nom apparaît dans le brand mark hero, le footer, les `<title>` et meta).

4. **Open Graph image** — à designer (PNG 1200×630). Probablement une variation du hero (titre serif sur fond crème + preview formulaire à droite).

5. **Compteur waitlist en temps réel** — actuellement on affiche 3 chiffres-preuves statiques (2 formulaires, 100 SPF, 1956). Si on veut afficher un compteur "X personnes inscrites", il faudra une API count + une mise à jour périodique. Volontairement écarté pour la v1.

6. **Section "À propos / Solo founder"** — discutée puis écartée. Peut être ajoutée plus tard si JB veut donner une dimension humaine au projet.

7. **Roadmap publique** — un lien existe dans le footer mais sans destination. À créer en page dédiée ou en notion public.

8. **Section témoignages** — intentionnellement absente : pas d'utilisateurs réels à ce stade, et fabriquer des témoignages serait malhonnête.

9. **Délai SPF dans le lede de la section 2** — le texte actuel dit *« attendre des mois »*, ce qui contredit la FAQ Q5 (10 jours en théorie). À corriger pendant l'implémentation : remplacer par *« attendre une réponse sans suivi »* ou équivalent.

10. **Mise en accordéon de la FAQ** — les Q/A sont actuellement toutes ouvertes pour valider le copy. À l'implémentation, considérer un accordéon (closed by default) pour économiser le scroll. Décision laissée au plan d'implémentation.

11. **Tracking analytics** — aucun analytics dans cette spec. À discuter selon préférence (privacy-friendly type Plausible, ou rien du tout).

---

## 9. Risques et tensions identifiés

| # | Risque | Mitigation |
|---|---|---|
| 1 | "Genealogy" n'est pas le nom final → renommage en cours d'implé | Centraliser le brand name dans une constante `BRAND_NAME` réutilisable |
| 2 | Tarifs SPF (12 €/6 €) peuvent évoluer | "à partir de" donne une marge ; un footer note légale peut renvoyer à la notice 3241-NOT-SD |
| 3 | La landing prétend que c'est compliqué d'envoyer aujourd'hui, mais l'envoi par courriel est possible (vérifié) | La pain #3 a été reformulée pour rester honnête sur ce point |
| 4 | Accessibilité de l'animation typewriter | `prefers-reduced-motion` désactive l'anim et affiche un état statique |
| 5 | RGPD waitlist | Insertion email avec consentement explicite (case à cocher ?) ou mention courte sous le formulaire ("En vous inscrivant, vous acceptez la politique de confidentialité") |
| 6 | Visiteurs déjà loggués qui atterrissent sur `/` | Décision : on affiche quand même la landing (publique), avec un bouton discret "Accéder à mon arbre" si session active. À implémenter ou non au choix |
| 7 | Cohérence avec l'app authentifiée | Volontairement distincte : la landing a sa propre identité éditoriale (cream plus chaud, Instrument Serif) qui ne contamine pas l'app |

---

## 10. Critères de succès (post-implémentation)

La landing est considérée comme livrée quand :

1. ✅ La route `/` rend les 6 sections sans erreur, en SSR, sans warning console
2. ✅ Le typewriter du hero cycle correctement sur les 4 sets et respecte `prefers-reduced-motion`
3. ✅ La soumission email écrit dans la table Supabase `waitlist_signups` et affiche un état de succès
4. ✅ Lighthouse Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
5. ✅ Les 3 sources officielles cliquables ouvrent les bonnes URLs en `target="_blank"`
6. ✅ Le rendu mobile (320px → 768px) reste lisible (le typewriter peut être désactivé en mobile si besoin)
7. ✅ Les utilisateurs déjà loggués peuvent toujours accéder à `/tree` sans problème

---

**Fin de la spec.** Cette spec est destinée à être consommée par :
- Le **spec-document-reviewer** (revue d'incohérences, ambiguïtés, oublis)
- Le **writing-plans skill** (génération du plan d'implémentation détaillé)
