# Contexte Projet Généalogie

*Dernière mise à jour : 22 mars 2026*

---

## Origine du projet

Application web collaborative d'arbre généalogique, initiée par Jean-Baptiste Botello. L'idée : permettre à une famille et à des généalogues professionnels de construire, enrichir et visualiser ensemble l'histoire familiale.

---

## Décisions clés prises en brainstorming

### Audience
- Généalogues professionnels (recherche)
- Membres de la famille (consultation + suggestions)
- Un admin gère les droits

### Plateforme
- **Web desktop uniquement** — pas de mobile en V1

### Collaboration
- Rôles : **ADMIN** (tout faire) / **EDITOR** (écrire, pas supprimer) / **VIEWER** (lecture seule)
- Invitations par email (flow Supabase natif, expiration 7 jours)

### Données d'une personne
- Nom, prénom, date de naissance, lieu de naissance, date de décès, lieu de décès, notes
- **Pas de photo** en V1
- **Documents PDF attachés** (actes de naissance, mariage, décès, autre) — 20 Mo max

### Relations
- Types complets : PARENT_CHILD, UNION, ADOPTION, SIBLING, HALF_SIBLING, STEP
- Convention : `person_a_id` = parent / `person_b_id` = enfant pour PARENT_CHILD et ADOPTION
- Divorce = `date_fin` dans le `metadata` d'une UNION (pas de type DIVORCE)
- Cycle prevention applicatif (une personne ne peut pas être son propre ancêtre)

### Structure de l'arbre
- Un seul arbre par déploiement (V1, pas de `tree_id`)
- **Branches nommées et colorées** (ex : Côté Maternel, Côté Paternel, Alliance Dupont)
- Une personne peut appartenir à plusieurs branches
- **Filtres** : par branche, vivant/décédé, avec documents

### Vues de visualisation
1. **🌌 Cosmos** (vue par défaut) — orbitale animée, personne sélectionnée au centre
2. **⧖ Sablier** — arbre classique React Flow
3. **📅 Timeline** — axe temporel (personnes sans date_naissance exclues)
4. **🗺 Carte** — géographique Leaflet + Nominatim (lieux non géocodés exclus)
5. **🌀 Éventail** — fan chart, 5ème onglet

### Hébergement
- **EU uniquement** (RGPD) — Supabase Frankfurt ou OVH/Scaleway France

---

## Stack technique validée

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| BDD | Supabase PostgreSQL (EU) |
| Auth | Supabase Auth + RLS |
| Storage | Supabase Storage (signed URLs) |
| Arbre | React Flow |
| Timeline | vis-timeline ou D3 custom |
| Carte | Leaflet + OpenStreetMap + Nominatim |
| Tests | Vitest + React Testing Library + Playwright |

---

## Backlog V1 (périmètre initial)

### Foundation (Plan 1 — en cours)
- [x] Spec design validée
- [x] Plan 1 écrit et reviewé
- [ ] Bootstrap Next.js 14 + TypeScript + Tailwind
- [ ] Schéma Supabase (migrations SQL)
- [ ] Auth : login, signup, accept-invite, middleware
- [ ] UI shell : Topbar, Sidebar, DetailPanel, layouts

### Core CRUD (Plan 2 — à faire)
- [ ] CRUD personnes
- [ ] CRUD relations (avec cycle detection)
- [ ] CRUD branches
- [ ] Upload/download documents PDF
- [ ] Géocodage server-side (Nominatim)
- [ ] Recherche ilike (overlay, 10 résultats)

### Vue Cosmos (Plan 3 — à faire)
- [ ] Visualisation orbitale animée
- [ ] Navigation par clic (recentrage)
- [ ] Tooltip au survol
- [ ] Indicateur personnes décédées (anneau pointillés)
- [ ] Union terminée = lien pointillés

### Vues secondaires (Plan 4 — à faire)
- [ ] Vue Sablier (React Flow)
- [ ] Vue Timeline
- [ ] Vue Carte (Leaflet)
- [ ] Vue Éventail (Fan chart)

### Collaboration (Plan 5 — à faire)
- [ ] Invitations par email
- [ ] Interface gestion des membres
- [ ] UI droits (boutons cachés selon rôle)

---

### Plan 7 — Lier des personnes (feature)
- [ ] Server action `createRelationship` (mapping rôle → type DB + metadata.role)
- [ ] Composant `LinkPersonForm` inline dans le DetailPanel
- [ ] Bouton `[+]` dans la section Relations (ADMIN/EDITOR uniquement)
- [ ] Affichage du rôle depuis `metadata.role` dans la liste des relations
- [ ] Cycle detection côté serveur
- [ ] Tests unit + component + integration

> Phase 2 (backlog V2) : déduction automatique des relations indirectes (cousins, oncles déduits de l'arbre)

---

## Backlog V2 (post-lancement)

- [ ] Import/export GEDCOM 7 (interopérabilité Ancestry, MyHeritage)
- [ ] Suggestions de modifications (VIEWER propose → EDITOR/ADMIN valide)
- [ ] Export PDF de l'arbre
- [ ] Notifications email pour les changements
- [ ] Mode présentation plein écran
- [ ] Support multi-arbre (migration + `tree_id`)
- [ ] Photos attachées aux personnes
- [ ] Chargement par voisinage (grands arbres)

---

## Documents de référence

| Fichier | Contenu |
|---------|---------|
| `docs/superpowers/specs/2026-03-22-genealogy-design.md` | Spec complète validée |
| `docs/superpowers/plans/2026-03-22-plan-1-foundation.md` | Plan d'implémentation — Foundation |

---

## Notes techniques importantes

- **Modèle de données** : pas de `tree_id` en V1 (single-tree per deployment)
- **Géocodage** : Nominatim (OpenStreetMap, EU, gratuit) — server-side uniquement
- **Documents** : PDF uniquement, 20 Mo max, accès via signed URLs (validité 7 jours)
- **Éditions concurrentes** : last-write-wins en V1
- **RLS** : toutes les politiques ont `USING` + `WITH CHECK` pour les UPDATE
- **Signout** : doit utiliser `<form action={signout}>` (pas `onClick`) — Server Action Next.js
