# Recherche foncière — Design Spec

*Date : 29 mars 2026*
*Statut : Validé*

---

## Contexte

Intégrer la génération pré-remplie des formulaires Cerfa 3233-SD (demande de renseignements immobiliers) et 3236-SD (demande de copie de documents fonciers) dans l'app Généalogie. L'objectif est de faciliter les recherches patrimoniales des ancêtres en pré-remplissant les PDF avec les données de l'arbre et en recommandant le bon SPF.

---

## Accès — Menu "Recherches" dans la Topbar

Un bouton "📋 Recherches" dans la Topbar (à côté du bouton "+" Ajouter). Au clic, un dropdown affiche :

- **Formulaire 3233** — Renseignements immobiliers
- **Formulaire 3236** — Copie de documents fonciers

### Comportement

- **Clic sur 3233** → ouvre directement le modal 3233
- **Clic sur 3236** → ouvre un écran de guidage avant le modal 3236

---

## Modal 3233 — Demande de renseignements

### Sections

**1. Personne concernée**
- Pré-remplie avec la personne actuellement sélectionnée dans l'arbre (`selectedPersonId`)
- Si aucune personne sélectionnée → champ vide avec invite "Sélectionnez une personne"
- Bouton "Changer" → ouvre une recherche (réutiliser le composant SearchOverlay existant ou un search inline)
- Affiche : initiales colorées + nom complet + date + lieu de naissance

**2. Type de recherche**
- Toggle deux options :
  - **Par personne** (défaut) — lister tous les biens détenus par l'individu
  - **Par immeuble** — historique d'une parcelle (affiche des champs supplémentaires : commune, section cadastrale, numéro de parcelle)

**3. Service de Publicité Foncière (SPF)**
- Recommandation automatique basée sur le `lieu_naissance` de la personne → extraction du département → mapping vers le SPF compétent
- Affiche : nom du SPF, département, email
- Lien "Choisir un autre SPF →" → dropdown avec tous les SPF de France

**4. Données pré-remplies (aperçu)**
- Grille lecture seule montrant les champs qui seront injectés dans le PDF :
  - Nom (en majuscules)
  - Prénoms
  - Date de naissance
  - Lieu de naissance
  - Date de décès (si applicable)
  - Lieu de décès (si applicable)
- Si recherche "Par immeuble" : champs commune, section, numéro de parcelle (saisis par l'utilisateur)

**5. Action**
- Bouton "📥 Générer le PDF pré-rempli"
- Télécharge un fichier `3233-SD-{nom}-{prenom}.pdf` pré-rempli
- Note en dessous : "Le PDF sera téléchargé prêt à imprimer et à envoyer au SPF en 2 exemplaires."

---

## Flow 3236 — Guidage + Modal

### Écran de guidage

Quand l'utilisateur clique sur "Formulaire 3236" dans le dropdown, le modal affiche d'abord un écran explicatif :

> **📄 Copie de documents fonciers**
>
> Pour remplir ce formulaire, vous aurez besoin des **références de publication** (volume et numéro) obtenues via une demande de renseignements 3233.
>
> Vous avez ces références ?
>
> **[Oui, j'ai les références]** → passe au modal 3236
> **[Non, commencer par un 3233]** → bascule sur le modal 3233

### Modal 3236

Mêmes sections que le 3233 sauf :

- **Section 2** remplacée par : **Références de publication**
  - Champ "Volume" (texte)
  - Champ "Numéro" (texte)
  - Ces champs sont obligatoires
- **Section Type de recherche** supprimée (le 3236 est toujours une demande de copie de document spécifique)

Le reste (personne, SPF, données pré-remplies, génération PDF) est identique au 3233.

---

## Génération PDF

### Librairie

Utiliser **`pdf-lib`** (côté client, pas de dépendance serveur) pour remplir les champs du formulaire PDF officiel.

### Fichiers PDF source

- `public/forms/cerfa-3233-sd.pdf` — formulaire 3233 vierge avec champs de formulaire
- `public/forms/cerfa-3236-sd.pdf` — formulaire 3236 vierge avec champs de formulaire

Ces PDF doivent être les versions officielles avec champs éditables (AcroForm). Ils seront versionnés dans le repo.

### Mapping des champs

Le code mappe les données de la personne vers les champs nommés du PDF :
- `nom` → champ PDF "Nom"
- `prenom` → champ PDF "Prénoms"
- `date_naissance` → champ PDF "Date de naissance"
- `lieu_naissance` → champ PDF "Lieu de naissance"
- etc.

Le mapping exact sera déterminé en inspectant les champs du PDF officiel lors de l'implémentation.

---

## Annuaire des SPF

### Fichier

`src/lib/spf-directory.ts` — un fichier TypeScript exportant un tableau de SPF avec :

```typescript
interface SPF {
  nom: string           // "SPF de Toulon"
  departement: string   // "83"
  departementNom: string // "Var"
  email: string         // "spf.toulon@dgfip.finances.gouv.fr"
  adresse?: string
}
```

### Détection automatique

Fonction `findSPFByLieu(lieu: string): SPF | null` qui :
1. Extrait le numéro de département depuis le lieu (ex: "Toulon (83)" → "83", ou "Toulon, Var" → "83")
2. Cherche le SPF correspondant dans l'annuaire

Fallback : si pas de correspondance, l'utilisateur choisit manuellement.

---

## Fichiers

| Fichier | Rôle |
|---------|------|
| `src/components/recherche/RechercheDropdown.tsx` | Dropdown dans la Topbar (menu Recherches) |
| `src/components/recherche/Formulaire3233Modal.tsx` | Modal pré-remplissage 3233 |
| `src/components/recherche/Formulaire3236Modal.tsx` | Modal guidage + pré-remplissage 3236 |
| `src/components/recherche/PersonSelector.tsx` | Composant de sélection de personne (réutilisable) |
| `src/components/recherche/SPFSelector.tsx` | Sélecteur de SPF avec auto-détection |
| `src/lib/spf-directory.ts` | Annuaire des SPF par département |
| `src/lib/pdf-filler.ts` | Fonctions de remplissage PDF avec pdf-lib |
| `public/forms/cerfa-3233-sd.pdf` | PDF source 3233 |
| `public/forms/cerfa-3236-sd.pdf` | PDF source 3236 |

---

## Ce qui ne change pas

- Cosmos, Sablier Flow, Timeline, Carte — inchangés
- DetailPanel, Sidebar — inchangés
- Données de l'arbre (persons, relationships) — lecture seule, pas de nouvelle table en base
