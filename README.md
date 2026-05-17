# Genealogy

Application web collaborative pour construire et visualiser un arbre généalogique familial, avec gestion des documents d'archives (PDF) et digitalisation des formulaires Cerfa SPF (3233/3236) pour la recherche foncière en France.

## Vue d'ensemble

- **Multi-utilisateurs** avec rôles `ADMIN` / `EDITOR` / `VIEWER` (RLS Supabase)
- **Auth** : email/password + Google SSO + reset password
- **CRUD** personnes + relations (père, mère, époux, grand-père, oncle, etc.)
- **Documents** : upload PDF par personne, signed URLs 7j, 20 Mo max
- **5 vues** : Cosmos (orbitale animée), Sablier Flow, Timeline, Carte (Leaflet), Éventail
- **Recherche foncière** : génération automatique des Cerfa 3233 et 3236 pré-remplis à partir des données de l'arbre, avec annuaire des 100 SPF français
- **Hébergement EU uniquement** (RGPD)

## Stack

- Next.js 16+ (App Router) — TypeScript — Tailwind
- Supabase (cloud Frankfurt) pour auth + DB + storage
- Vitest pour les tests (359 tests)
- pdf-lib pour le remplissage des Cerfa
- Leaflet pour la vue Carte
- Déployé sur Vercel

## Installation

Prérequis : Node.js 20+, un projet Supabase (cloud ou self-hosted).

```bash
git clone https://github.com/Jean-BaptisteBotello/genealogy.git
cd genealogy
npm install
cp .env.local.example .env.local
# Renseigner les 3 variables Supabase dans .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (région EU recommandée)
2. Appliquer les migrations SQL dans l'ordre : `supabase/migrations/001_*.sql` → `004_*.sql`
3. Créer un bucket Storage privé nommé `documents`
4. Récupérer `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans Project Settings → API

## Tests

```bash
npm run test:run      # full suite (~5s)
npm run test          # watch mode
```

## Structure

```
src/
├── app/                    # Next.js App Router (landing, auth, app)
├── components/
│   ├── cosmos/             # Vue Cosmos (orbitale)
│   ├── views/sablier/      # Vue Sablier Flow
│   ├── views/timeline/     # Vue Timeline
│   ├── views/carte/        # Vue Carte (Leaflet)
│   ├── person/             # Modales CRUD + lien personnes
│   ├── recherche/          # Formulaires Cerfa 3233/3236
│   ├── layout/             # Topbar, Sidebar, DetailPanel, AppShell
│   └── onboarding/         # Coach marks 4 steps
├── lib/
│   ├── supabase/           # Clients Supabase (client/server/admin)
│   ├── pdf-filler.ts       # Remplissage PDF Cerfa
│   └── spf-directory.ts    # Annuaire des 100 SPF
├── server-actions/         # Auth + CRUD persons/relationships/documents
└── ...

supabase/migrations/        # Schémas + RLS policies
docs/                       # Specs et plans de conception
```

## Modèle de données (simplifié)

- `person` — personne (prénom, nom, dates/lieux naissance/décès, lat/lon)
- `relationship` — lien entre 2 personnes (`PARENT_CHILD` ou `UNION`)
- `branch` — branche familiale (paternel/maternel/etc.)
- `person_branch` — assignation personne ↔ branches
- `document` — fichier PDF lié à une personne
- `tree_member` — membre du tree avec son rôle
- `suggestion` — proposition de modification par un VIEWER

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT — voir [LICENSE](LICENSE).
