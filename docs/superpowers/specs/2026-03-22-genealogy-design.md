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
| Stockage documents | Supabase Storage (accès par signed URLs, 20 Mo max) |
| Vue Arbre | React Flow |
| Vue Timeline | vis-timeline ou composant D3 custom léger |
| Vue Carte | Leaflet + OpenStreetMap + Nominatim (géocodage EU, server-side) |
| Hébergement | EU uniquement (Frankfurt / OVH / Scaleway — RGPD) |

---

## 3. Modèle de données

### Person
```
id              uuid PK
prenom          text
nom             text
date_naissance  date (nullable)
lieu_naissance  text (nullable)
lat_naissance   float (nullable)  -- géocodé server-side via Nominatim à la sauvegarde
lon_naissance   float (nullable)
date_deces      date (nullable)
lieu_deces      text (nullable)
lat_deces       float (nullable)
lon_deces       float (nullable)
notes           text (nullable)
created_at      timestamp
updated_at      timestamp
```

### Relationship
```
id            uuid PK
person_a_id   uuid FK → Person
person_b_id   uuid FK → Person
type          enum: PARENT_CHILD | UNION | ADOPTION | SIBLING | HALF_SIBLING | STEP
metadata      jsonb
  -- Pour UNION : { date_debut, date_fin (nullable) }
  -- Pour PARENT_CHILD / ADOPTION : { note }
```

**Convention de direction :**
- `PARENT_CHILD` : `person_a_id` = parent, `person_b_id` = enfant (toujours)
- `ADOPTION` : `person_a_id` = parent adoptif, `person_b_id` = enfant adopté
- `UNION` : bidirectionnel (A et B interchangeables)
- `SIBLING`, `HALF_SIBLING`, `STEP` : bidirectionnel

**Fin d'union :** Un divorce ou une séparation est modélisé en ajoutant `date_fin` dans le `metadata` d'une relation `UNION` existante. Il n'existe pas de type `DIVORCE`.

**Prévention des cycles :** La couche applicative vérifie qu'une personne n'apparaît pas dans sa propre chaîne d'ascendance avant d'enregistrer une relation `PARENT_CHILD` ou `ADOPTION`.

### Branch
```
id          uuid PK
nom         text
couleur     text  -- hex color
description text (nullable)
created_by  uuid FK → User
created_at  timestamp
```

### PersonBranch (table de jointure)
```
person_id   uuid FK → Person
branch_id   uuid FK → Branch
```
Une personne peut appartenir à plusieurs branches.

### Document
```
id            uuid PK
person_id     uuid FK → Person
nom           text
type          enum: ACTE_NAISSANCE | ACTE_MARIAGE | ACTE_DECES | AUTRE
  -- V1 : PDF uniquement. Photos et autres médias hors périmètre V1.
url_stockage  text  -- Supabase Storage path (accès via signed URL)
taille_bytes  integer  -- max 20 971 520 (20 Mo)
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

**Architecture single-tree (V1) :** Cette version supporte un seul arbre par déploiement. Il n'y a pas de `tree_id`. Le support multi-arbre est explicitement hors périmètre V1 et fera l'objet d'une migration de schéma en V2 si nécessaire.

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
| Créer une branche | ✅ | ✅ | ❌ |
| Supprimer une branche | ✅ | ❌ | ❌ |
| Gérer les membres | ✅ | ❌ | ❌ |

Les permissions sont enforced côté serveur via Supabase RLS sur chaque table.

**Flux d'invitation :** Utilise le flow natif Supabase Auth (`supabase.auth.admin.inviteUserByEmail`). À l'acceptation de l'invitation, une ligne `TreeMember` est créée avec le rôle pré-assigné. Les invitations expirent après 7 jours (configurable dans le dashboard Supabase).

---

## 5. Structure de l'arbre

Un seul arbre principal par déploiement (V1, voir Section 3). L'arbre est organisé en **branches nommées** (ex : Côté Maternel, Côté Paternel, Alliance Dupont) avec une couleur par branche. Une personne peut appartenir à plusieurs branches.

Des **filtres** permettent d'isoler une branche, de filtrer les personnes vivantes/décédées, ou celles ayant des documents attachés.

---

## 6. Vues de visualisation

**Comportement des nœuds orphelins (personne sans relation) :** Dans toutes les vues graphiques (Cosmos, Sablier, Éventail), les nœuds orphelins flottent librement et sont regroupés dans une zone "Non reliés" en bas à gauche du canvas. Ils sont inclus dans la Timeline et la Carte si leurs dates/lieux sont renseignés.

### 🌌 Vue Cosmos (vue par défaut)
Visualisation orbitale animée. La personne sélectionnée est le "soleil" au centre, ses proches sont des planètes en orbite à des distances proportionnelles au degré de parenté.

- Orbite ~80px : conjoint(e) actuel(le)
- Orbite ~110px : parents, enfants, fratrie directe
- Orbite ~170-200px : grands-parents, petits-enfants, oncles/tantes
- Orbite ~240-280px : arrière-grands-parents, cousins

Les liens familiaux sont des trajectoires courbes. Clic sur un nœud → recentre l'orbite sur cette personne. Tooltip au survol : nom, relation, dates, lieux. Anneau en pointillés pour les personnes décédées. Union terminée (date_fin renseignée) → lien en pointillés.

### ⧖ Vue Sablier
Arbre classique centré sur une personne sélectionnée. Ancêtres au-dessus, descendants en dessous. Implémenté avec React Flow. Navigation par clic. Nœuds orphelins : affichés dans un panneau latéral "Personnes non reliées".

### 🌀 Vue Éventail (Fan chart)
5ème onglet dans le sélecteur de vue (topbar). La personne sélectionnée au centre, générations en arcs concentriques. Idéal pour impression/export PDF (V2). Nœuds orphelins exclus de cette vue.

### 📅 Vue Timeline
Toutes les personnes de l'arbre placées sur un axe temporel (date de naissance). Filtrable par branche. **Les personnes sans `date_naissance` sont exclues de la Timeline** et signalées dans la sidebar sous "Non placées sur la timeline".

### 🗺 Vue Carte géographique
Les lieux de naissance et de décès géolocalisés sur Leaflet + OpenStreetMap. Géocodage server-side via Nominatim au moment de la sauvegarde (pas de géocodage côté client). Si le géocodage échoue, les coordonnées restent nulles et la personne est exclue de la carte avec une notification dans la sidebar. **Les personnes sans coordonnées sont exclues de la carte** et listées dans "Lieux non géolocalisés". Filtrable par branche et par période.

---

## 7. Carte personne & panneau détail

**Dans l'arbre (carte compacte) :**
- Nom de famille (en couleur de branche)
- Prénom
- Date et lieu de naissance
- Date et lieu de décès (si applicable)
- Badge indiquant le nombre de documents attachés

**Panneau droit (au clic sur une personne) :**
- Tous les champs de la carte
- Tag(s) de branche(s)
- Liste des documents attachés (téléchargeable via signed URL, 7 jours de validité)
- Bouton "Ajouter un document" (EDITOR/ADMIN uniquement)
- Liste des relations (conjoint, parents, enfants, fratrie…) avec lien cliquable
- Boutons : Modifier / Supprimer (selon les droits)

---

## 8. Navigation et structure de l'interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Topbar: Logo · 🌌 Cosmos ⧖ Sablier 📅 Timeline 🗺 Carte 🌀 Éventail │
│          · + Ajouter · 🔍 Recherche · Avatar/Profil             │
├──────────────┬──────────────────────────────┬───────────────────┤
│  Sidebar     │                              │  Panneau détail   │
│  - Branches  │    Canvas principal          │  (personne        │
│  - Filtres   │    (vue active)              │   sélectionnée)   │
│  - Membres   │                              │                   │
│  - Paramètres│                              │  Fermé par défaut │
└──────────────┴──────────────────────────────┴───────────────────┘
```

---

## 9. Stratégie d'accès aux données

- **Pattern principal :** Next.js Server Actions pour les mutations (create/update/delete). Appels Supabase client directs (avec RLS) pour les lectures côté client.
- **Chargement de l'arbre :** Chargement complet de l'arbre en V1 (toutes les personnes + relations en une seule requête au montage). Acceptable pour une famille de quelques centaines de personnes. Pagination ou chargement par voisinage différé à V2 si nécessaire.
- **Format graphe :** Le serveur transforme les données en `{ nodes: Person[], edges: Relationship[] }` avant de les envoyer au composant React Flow / Cosmos.
- **Géocodage :** Server Action déclenchée à la sauvegarde d'une personne avec lieu renseigné. Appel Nominatim (OpenStreetMap, gratuit, EU). Résultat stocké dans `lat_*` / `lon_*`. Erreur silencieuse : coordonnées restent nulles.
- **Éditions concurrentes :** Last-write-wins en V1. Supabase Realtime hors périmètre V1.

---

## 10. Recherche

- Champ de recherche dans la topbar (icône 🔍)
- Recherche `ilike` sur `prenom`, `nom`, `lieu_naissance`, `lieu_deces` via Supabase
- Résultats affichés dans un overlay/dropdown (max 10 résultats)
- Clic sur un résultat → recentre la vue active sur cette personne et ouvre le panneau détail

---

## 11. Fonctionnalités V1 (périmètre initial)

- [x] Auth (inscription, connexion, invitations par email — flow Supabase natif)
- [x] Gestion des membres et des rôles (ADMIN / EDITOR / VIEWER)
- [x] CRUD personnes (nom, prénom, dates, lieux, notes)
- [x] CRUD relations (UNION, PARENT_CHILD, SIBLING, HALF_SIBLING, STEP, ADOPTION)
- [x] Fin d'union via `date_fin` dans metadata
- [x] Prévention des cycles (validation applicative)
- [x] Branches nommées et colorées (CRUD, assignation multiple par personne)
- [x] Filtres (par branche, vivant/décédé, avec documents)
- [x] Attach/détach de documents PDF (20 Mo max, signed URLs)
- [x] Vue Cosmos (vue par défaut, animée, interactive)
- [x] Vue Sablier (React Flow)
- [x] Vue Timeline (exclusion des personnes sans date)
- [x] Vue Carte géographique (Leaflet + Nominatim, exclusion des lieux non géocodés)
- [x] Vue Éventail (5ème onglet)
- [x] Panneau détail personne
- [x] Recherche (ilike, overlay, max 10 résultats)

## 12. Fonctionnalités V2 (post-lancement)

- [ ] Import/export GEDCOM 7 (interopérabilité Ancestry, MyHeritage)
- [ ] Suggestions de modifications (VIEWER propose → EDITOR/ADMIN valide)
- [ ] Export PDF de l'arbre (vue Sablier ou Éventail)
- [ ] Notifications email pour les changements
- [ ] Mode présentation plein écran
- [ ] Support multi-arbre (migration de schéma + `tree_id`)
- [ ] Photos attachées aux personnes
- [ ] Chargement par voisinage (optimisation pour très grands arbres)

---

## 13. Contraintes non-fonctionnelles

- Hébergement **EU uniquement** (RGPD) — Supabase Frankfurt ou OVH/Scaleway France
- Documents : **PDF uniquement**, **20 Mo maximum** par fichier, accès via signed URLs (validité 7 jours)
- Géocodage : Nominatim/OpenStreetMap uniquement (EU, open source, pas de données envoyées à Google)
- Temps de chargement initial < 3s sur connexion standard
- Interface **desktop-first** (web, navigateur), pas d'app mobile en V1

---

## 14. États UI

- **Arbre vide (0 personne) :** Écran d'accueil avec call-to-action "Ajouter la première personne" centré sur le canvas. Pas de vue Cosmos vide.
- **Chargement :** Skeleton animé sur le canvas pendant le chargement du graphe. Spinner dans le panneau détail pendant les mutations.
- **Erreurs :** Toast en bas à droite (4 secondes) pour les erreurs non bloquantes (ex : géocodage échoué, document trop lourd). Modal de confirmation pour les suppressions.
- **Succès :** Pas de toast pour les succès silencieux (sauvegarde, ajout de relation). Confirmation visuelle via l'état du panneau (les données se mettent à jour).
- **Permissions insuffisantes :** Les actions non autorisées sont masquées dans l'UI (pas de bouton "Modifier" pour un VIEWER). Si l'appel serveur est refusé malgré tout, toast d'erreur "Action non autorisée".
