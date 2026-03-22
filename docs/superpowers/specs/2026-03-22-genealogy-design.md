# Genealogy App — Design Spec
*Date : 22 mars 2026 · Auteur : Pierre Dupont*

---

## 1. Vue d'ensemble

Application web collaborative de généalogie familiale permettant de créer, enrichir et visualiser un arbre généalogique partagé. L'app est centrée sur une expérience visuelle distinctive (vue cosmos) et permet d'attacher des documents d'archives (actes de naissance, actes de mariage, etc.) à chaque personne.

**Utilisateurs cibles :**
- Généalogues professionnels (recherche, navigation dans l'arbre)
- Membres de la famille (consultation, suggestions)
- Administrateur de l'arbre (gestion des droits et du contenu)

---

## 2. Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Base de données | Supabase PostgreSQL — région EU (Frankfurt ou OVH self-hosted) |
| Auth + Permissions | Supabase Auth + Row Level Security (RLS) |
| Stockage documents | Supabase Storage |
| Vue Arbre | React Flow |
| Vue Timeline | vis-timeline ou composant D3 custom léger |
| Vue Carte | Leaflet + OpenStreetMap |
| Hébergement | EU uniquement (Frankfurt / OVH / Scaleway) |

---

## 3. Modèle de données

### Person
```
id            uuid PK
prenom        text
nom           text
date_naissance date (nullable)
lieu_naissance text (nullable)
date_deces    date (nullable)
lieu_deces    text (nullable)
notes         text (nullable)
created_at    timestamp
updated_at    timestamp
```

### Relationship
```
id            uuid PK
person_a_id   uuid FK → Person
person_b_id   uuid FK → Person
type          enum: PARENT_CHILD | UNION | DIVORCE | ADOPTION | SIBLING | HALF_SIBLING | STEP
metadata      jsonb  -- ex: date de mariage, date de divorce
```
Les relations sont bidirectionnelles : une seule entrée suffit pour A↔B.

### Branch
```
id            uuid PK
nom           text
couleur       text  -- hex color
description   text (nullable)
```

### PersonBranch (table de jointure)
```
person_id     uuid FK → Person
branch_id     uuid FK → Branch
```
Une personne peut appartenir à plusieurs branches.

### Document
```
id            uuid PK
person_id     uuid FK → Person
nom           text
type          text  -- "acte_naissance", "acte_mariage", "photo", "autre"
url_stockage  text  -- Supabase Storage path
taille_bytes  integer
uploaded_by   uuid FK → User
created_at    timestamp
```

### User
```
id            uuid PK (Supabase Auth)
email         text
display_name  text
avatar_url    text (nullable)
```

### TreeMember (droits d'accès)
```
user_id       uuid FK → User
role          enum: ADMIN | EDITOR | VIEWER
invited_at    timestamp
invited_by    uuid FK → User
```

---

## 4. Gestion des droits

| Action | ADMIN | EDITOR | VIEWER |
|--------|-------|--------|--------|
| Consulter l'arbre | ✅ | ✅ | ✅ |
| Ajouter une personne | ✅ | ✅ | ❌ |
| Modifier une personne | ✅ | ✅ | ❌ |
| Supprimer une personne | ✅ | ❌ | ❌ |
| Ajouter un document | ✅ | ✅ | ❌ |
| Supprimer un document | ✅ | ❌ | ❌ |
| Gérer les membres | ✅ | ❌ | ❌ |
| Gérer les branches | ✅ | ✅ | ❌ |
| Supprimer une branche | ✅ | ❌ | ❌ |

Les permissions sont enforced côté serveur via Supabase RLS.

---

## 5. Structure de l'arbre

Un seul arbre principal par application. L'arbre est organisé en **branches nommées** (ex : Côté Maternel, Côté Paternel, Alliance Dupont) avec une couleur par branche. Une personne peut appartenir à plusieurs branches.

Des **filtres** permettent d'isoler une branche, de filtrer les personnes vivantes/décédées, ou celles ayant des documents attachés.

---

## 6. Vues de visualisation

### 🌌 Vue Cosmos (vue par défaut)
Visualisation force-directed / orbitale. La personne sélectionnée est au centre (le "soleil"), ses proches sont des planètes en orbite à des distances proportionnelles au degré de parenté. Les liens familiaux sont représentés par des trajectoires courbes. L'animation est fluide. On navigue en cliquant sur une personne pour la centrer.

- Orbite proche (~80px) : conjoint(e)
- Orbite moyenne (~110px) : parents, enfants, fratrie
- Orbite large (~170-200px) : grands-parents, petits-enfants, oncles/tantes
- Orbite lointaine (~240-280px) : arrière-grands-parents, cousins
- Indicateur visuel pour les personnes décédées (anneau en pointillés)
- Tooltip au survol : nom, relation, dates, lieux

### ⧖ Vue Sablier
Arbre classique centré sur une personne. Ancêtres au-dessus, descendants en dessous. Navigation par clic. Implémenté avec React Flow.

### 🌀 Vue Éventail (Fan chart)
Option accessible via les paramètres. La personne sélectionnée au centre, générations en arcs concentriques. Idéal pour une impression/export ou une vue d'ensemble.

### 📅 Vue Timeline
Toutes les personnes de l'arbre placées sur un axe temporel (date de naissance). Permet de voir les générations et les périodes historiques. Filtrable par branche.

### 🗺 Vue Carte géographique
Toutes les lieux de naissance et de décès des personnes de l'arbre géolocalisés sur une carte (Leaflet + OpenStreetMap). Permet de visualiser les déplacements et migrations de la famille dans le temps. Filtrable par branche et par période.

---

## 7. Carte personne & panneau détail

**Dans l'arbre (carte compacte) :**
- Nom de famille (en couleur de branche)
- Prénom
- Date et lieu de naissance
- Date et lieu de décès (si applicable)
- Indicateur de nombre de documents

**Panneau droit (au clic sur une personne) :**
- Tous les champs de la carte
- Tag(s) de branche(s)
- Liste des documents attachés (téléchargeable)
- Bouton "Ajouter un document"
- Liste des relations (conjoint, parents, enfants, fratrie…)
- Boutons : Modifier / Supprimer (selon les droits)

---

## 8. Navigation et structure de l'interface

```
┌─────────────────────────────────────────────────────────┐
│ Topbar : Logo · Sélecteur de vue · + Ajouter · Profil   │
├──────────────┬──────────────────────────┬───────────────┤
│  Sidebar     │                          │  Panneau      │
│  - Branches  │    Canvas principal      │  détail       │
│  - Filtres   │    (vue active)          │  (personne    │
│  - Membres   │                          │   sélect.)    │
│  - Paramètres│                          │               │
└──────────────┴──────────────────────────┴───────────────┘
```

---

## 9. Fonctionnalités V1 (périmètre initial)

- [x] Auth (inscription, connexion, invitations par email)
- [x] Gestion des membres et des rôles (ADMIN / EDITOR / VIEWER)
- [x] CRUD personnes (nom, prénom, dates, lieux, notes)
- [x] CRUD relations (tous types : UNION, PARENT_CHILD, SIBLING, HALF_SIBLING, STEP, ADOPTION, DIVORCE)
- [x] Branches nommées et colorées (CRUD, assignation multiple par personne)
- [x] Filtres (par branche, vivant/décédé, avec documents)
- [x] Attach/détach de documents PDF (upload, visualisation, suppression)
- [x] Vue Cosmos (vue par défaut, animée, interactive)
- [x] Vue Sablier (React Flow)
- [x] Vue Timeline
- [x] Vue Carte géographique (Leaflet)
- [x] Vue Éventail (option paramètres)
- [x] Panneau détail personne
- [x] Recherche de personnes

## 10. Fonctionnalités V2 (post-lancement)

- [ ] Import/export GEDCOM 7 (interopérabilité Ancestry, MyHeritage)
- [ ] Suggestions de modifications (les VIEWER peuvent proposer, un EDITOR/ADMIN valide)
- [ ] Export PDF de l'arbre (vue sablier ou éventail)
- [ ] Notifications (email) pour les changements
- [ ] Mode présentation (affichage plein écran pour partager en famille)

---

## 11. Contraintes non-fonctionnelles

- Hébergement **EU uniquement** (RGPD) — Supabase Frankfurt ou OVH/Scaleway France
- Les documents (PDF) ne doivent pas être indexés publiquement — accès signé (signed URLs)
- Temps de chargement initial < 3s sur connexion standard
- L'interface est desktop-first (web, navigateur), pas d'app mobile en V1
