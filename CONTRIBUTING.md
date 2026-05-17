# Contribuer

Merci d'envisager de contribuer ! Le projet est ouvert aux PRs.

## Démarrer

1. Fork le repo et clone ton fork
2. Crée une branche : `git checkout -b feat/ma-feature` (ou `fix/mon-bug`)
3. Suis les instructions d'install dans le [README](README.md)
4. Vérifie que les tests passent : `npm run test:run`

## Standards

- **TypeScript strict** — pas de `any` non justifié
- **Tests** — toute nouvelle fonctionnalité ou correction de bug doit avoir un test (Vitest + Testing Library)
- **RLS** — toute modification de schéma Supabase doit s'accompagner des RLS policies correspondantes
- **Composants** — préférer petits composants ciblés plutôt que gros monolithes
- **i18n** — l'interface est en français ; garder cette cohérence dans les nouveaux écrans
- **RGPD** — pas d'envoi de données vers des services hors EU sans raison forte

## Workflow PR

1. Ouvre une issue avant de commencer une grosse PR (>200 lignes) pour valider l'approche
2. Garde tes PRs petites et focalisées (une feature ou un fix par PR)
3. Le titre suit le format [Conventional Commits](https://www.conventionalcommits.org/) : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
4. Description : qu'est-ce que ça change, pourquoi, comment tester
5. CI doit être verte (tests + build)
6. Au moins un reviewer doit approuver

## Lancer le projet en local

```bash
npm install
cp .env.local.example .env.local   # puis remplir les 3 variables Supabase
npm run dev                         # http://localhost:3000
npm run test                        # watch mode
```

## Reporter un bug

Ouvre une issue avec :
- Étapes pour reproduire
- Comportement attendu vs observé
- Capture d'écran si UI
- Version du navigateur + OS

## Suggérer une feature

Ouvre une issue avec le label `enhancement`. Explique le besoin utilisateur avant la solution.

## Code de conduite

Sois respectueux. Pas de discrimination, pas de harcèlement. Les contributions techniques sont jugées sur leurs mérites techniques.

## Questions

Ouvre une issue avec le label `question`.
