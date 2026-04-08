# Cerfa Field Mapping Spec — 3233-SD et 3236-SD

**Date de collecte :** 2026-04-07 / 2026-04-08
**Contexte :** Feature recherche foncière du projet Généalogie. Cette spec complète [2026-03-29-recherche-fonciere-design.md](2026-03-29-recherche-fonciere-design.md) avec le mapping exact de chaque champ PDF des formulaires Cerfa officiels.

## Pourquoi cette spec

La V1 de `src/lib/pdf-filler.ts` utilise des heuristiques (`field.name.includes('nom')`, etc.) pour mapper les champs PDF. Problème : **les champs des Cerfa officiels s'appellent `a1`, `a2`, `b1`, `cac2`** — jamais "nom" ou "prenom". Les heuristiques ne matchent rien → les PDFs générés sont vides.

Solution : mapping explicite field-par-field, collecté visuellement en remplissant chaque champ avec son propre nom (debug PDF), puis en identifiant à quel libellé correspond chaque `aXX` / `bXX` / `cacXX`.

## Décision d'architecture : Option B pour les fields manquants

Pour les zones où le Cerfa officiel n'a pas de form field interactif (JJ/MM des dates de période, total frais d'expédition 3233), au lieu de dessiner du texte sur la page (option A), on **ajoute de vrais form fields** via pdf-lib :

```ts
const field = form.createTextField('b_exp')
field.addToPage(page, { x, y, width, height })
field.setText(value)
```

Résultat visuel identique mais le PDF reste éditable en post. Exception possible : checkboxes du mode de paiement 3236 (création plus complexe → option A = dessin du ✗ aux coords).

---

## 1. Bloc demandeur (commun 3233 et 3236)

**Les mêmes fields `a1`-`a11` sur les deux formulaires.**

| Field | Contenu | Notes |
|---|---|---|
| `a1` | Identité — nom + prénoms du demandeur (MAJUSCULES) | note ¹ |
| `a2` | Adresse ligne 1 (n° + rue) | |
| `a3` | Adresse ligne 2 (complément) | |
| `a4` | Adresse ligne 3 (CP + ville) | |
| `a5` | Courriel | note ² |
| `a6` | Téléphone | |
| `a7` | Ville de signature | |
| `a8` / `a9` / `a10` | Date du jour — JJ / MM / AAAA (3 fields séparés) | auto = date du jour |
| `a11` | SPF destinataire | depuis SPFSelector |
| *Signature* | Champ séparé | Module de signature → V2 (signature_pad ou zone manuelle) |

**Implémentation :** profil demandeur persisté en `localStorage` (petit formulaire éditable une fois), qui pré-remplit `a1`-`a7`. Date du jour auto pour `a8`/`a9`/`a10`. `a11` depuis `SPFSelector` existant.

---

## 2. Cerfa 3236-SD (copie de documents fonciers)

### Workflow utilisateur

Le 3236 sert à **obtenir des copies de documents dont on connaît déjà les références** (volume/numéro). Contrairement à ce que la première version du modal laissait penser, **il n'y a pas de bloc "personne concernée"** — c'est une recherche par références de registre. Peut être demandé sans avoir fait de 3233 préalable (références obtenues autrement).

→ **À supprimer du modal 3236 actuel :** `PersonSelector` et le message de guidance "si pas de références, commence par un 3233".

### 2.1 Bloc "Nature et référence des documents" — 7 formalités max

| N° | Nature du document *(bordereau d'inscription, saisie, publication)* | Date de la formalité | N° SAGES / SPF | Volume | Numéro |
|---|---|---|---|---|---|
| 1 | `a12` | `a13` | `a14` | `a15` | `a16` |
| 2 | `a17` | `a18` | `a19` | `a20` | `a21` |
| 3 | `a22` | `a23` | `a24` | `a25` | `a26` |
| 4 | `a27` | `a28` | `a29` | `a30` | `a31` |
| 5 | `a32` | `a33` | `a34` | `a35` | `a36` |
| 6 | `a37` | `a38` | `a39` | `a40` | `a41` |
| 7 | `a42` | `a43` | `a44` | `a45` | `a46` |

- **Nature** : texte libre (ex. "Publication", "Bordereau d'inscription")
- **Date** : JJ/MM/YYYY
- **N° SAGES** : alphanumérique (ex. `1324P02` — 7 caractères, les 2-3 premiers = numéro du département). Obtenu depuis les états-réponses antérieurs du SPF. Alternative : nom du SPF compétent.
- **Volume** : numérique (ex. `3525`)
- **Numéro** : numérique (ex. `16`)

**UI :** 1 ligne par défaut, bouton "+ Ajouter une formalité" jusqu'à 7.

### 2.2 Bloc "Coût et facturation" 3236

| Label | Nombre | Tarif | Total |
|---|---|---|---|
| Bordereau(x) d'inscription demandé(s) | `b1` | × 6 € | `b2` (= b1×6) |
| Frais d'expédition (1 €/bordereau ; 0 si courriel) | `b3` | × 1 € | `b4` (= b3×1) |
| État(s) descriptif(s) de division, modificatif(s) ou règlement(s) de copropriété | `b5` | × 30 € | `b6` (= b5×30) |
| Autre(s) document(s) demandé(s) | `b7` | × 15 € | `b8` (= b7×15) |
| Frais d'expédition (2 €/document ; 0 si courriel) | `b9` | × 2 € | `b10` (= b9×2) |
| **TOTAL** | | | `zc1` = b2+b4+b6+b8+b10 |

Totaux calculés automatiquement côté UI. L'utilisateur ne saisit que les "Nombre" (b1, b3, b5, b7, b9).

### 2.3 Bloc "Mode de paiement" 3236

**⚠ Le PDF 3236 n'a PAS de checkboxes interactives** pour le mode de paiement. Inspection via pdf-lib : seulement `notice` (button), `a1`-`a46`, `b1`-`b10`, `zc1`. Aucun `cacX`. Les cases visibles sur le PDF sont dessinées graphiquement.

Options : Carte bancaire / Virement / Chèque de Banque (> 1000 €) / Chèque (max 1000 €) / Numéraire (max 300 €).

**Solution MVP :** dessiner un ✗ aux coordonnées de la case choisie (option A — coords à mesurer manuellement).
**Vision long terme :** paiement en ligne intégré dans l'app → cette section PDF devient obsolète (la demande est transmise électroniquement).

### 2.4 Notes de bas de page 3236 (¹²³)

À afficher dans le modal UI, avec les appels au bons endroits :

> **¹** Nom (en majuscules), prénom(s) ou dénomination sociale (en majuscules).
> **²** L'indication du courriel autorise l'administration à vous répondre par courriel.
> **³** Indiquer soit le numéro SAGES soit le nom du SPF compétent à la date d'exécution de la formalité. Le numéro SAGES est le numéro d'identification du SPF figurant sur les états-réponses délivrés suite à une demande sur l'imprimé n° 3233-SD ou 3240-SD. Constitué de 7 caractères dont les 2 ou 3 premiers correspondent au numéro du département (exemples : 1314P02, 9714P32).

Appels : ¹ sur "Identité", ² sur "Courriel", ³ dans l'en-tête de colonne "Numéro SAGES…".

### 2.5 Blocs à ne pas toucher (déjà dans le PDF source)

- Cadre réservé à l'administration (demande irrégulière / réponse du SPF)
- Mention CNIL (loi 78-17)
- Bandeau République Française / DGFiP / Cerfa 11194*07

---

## 3. Cerfa 3233-SD (demande de renseignements)

### Workflow utilisateur

Recherche par personne **et/ou** par immeuble. Période limitée à partir du **1er janvier 1956** — ⚠ limite importante pour la généalogie : pour un ancêtre décédé avant 1956, le 3233 n'est pas utilisable. **Warning UI** à afficher si `date_naissance < 1956` (ou `date_deces < 1956`).

Aide utilisateur à afficher : *"en DEUX exemplaires si réponse souhaitée par courrier ; en UN seul si par courriel"*.

### 3.1 Bloc "Identification des personnes" — max 3 personnes

| N° | Nom (MAJUSCULES) / Dénomination | Prénom(s) / Siège social ³ | Date et lieu de naissance / N° SIREN |
|---|---|---|---|
| 1 | `a12` | `a13` | `a14` |
| 2 | `a15` | `a16` | `a17` |
| 3 | `a18` | `a19` | `a20` |

- **Nom** : `.toUpperCase()` avant `setText`.
- **Date et lieu de naissance** (personne physique) : format `"JJ/MM/YYYY à Ville-Nom"` (séparateur " à ", caractères spéciaux autorisés pour les villes comme Aix-en-Provence). Si date incomplète : `"AAAA à Ville"`.
- **N° SIREN** (personne morale) : 9 chiffres, dans le même champ `a14`/`a17`/`a20`. Un toggle "Personne physique / Personne morale" dans l'UI par ligne.
- **Au-delà de 3 personnes** → feuille de suite (page 2, fields c2-c29 — voir §3.6, **hors scope V1**). Warning UI.

### 3.2 Bloc "Désignation des immeubles" — max 5 immeubles

| N° | Commune (MAJUSCULES) + rue/n° | Réf. cadastrales (préfixe, section, n°) | N° division volumétrique | N° lot copropriété |
|---|---|---|---|---|
| 1 | `a21` | `a22` | `a23` | `a24` |
| 2 | `a25` | `a26` | `a27` | `a28` |
| 3 | `a29` | `a30` | `a31` | `a32` |
| 4 | `a33` | `a34` | `a35` | `a36` |
| 5 | `a37` | `a38` | `a39` | `a40` |

Exemples réels confirmés : `"MARSEILLE - 38 avenue FOCH"`, `"section E - plan n°68"`, `"818"` (division volumétrique), `"12"` (lot). **Au-delà de 5** → feuille de suite (c30-c64), V2.

### 3.3 Bloc "Période de délivrance" 3233

**Cas général** : période 1er janvier 1956 → aujourd'hui (rien à remplir, cas par défaut).

**Cas particulier** :
- **Point de départ** : JJ + MM **à créer via option B** (nouveau form field), année = `a43`
- **Point d'arrivée** : JJ + MM **à créer via option B**, année = `a46`
- ⚠ Note : `a41`, `a42`, `a44`, `a45` existent dans le field list du PDF **MAIS ne correspondent PAS aux JJ/MM** de ces dates (confirmé visuellement — ces slots sont des lignes dessinées sur la page, pas des fields interactifs). **Fields fantômes, ne pas les toucher.**
- ☑ **"limiter au dernier propriétaire connu"** = checkbox **`cac1`** (boolean)

**Note ⁴ :** pour une demande "immeubles uniquement", `a43`/`a46` peuvent aussi recevoir une "date de rénovation du cadastre" au lieu d'une date calendaire.

### 3.4 Bloc "Coût et facturation" 3233

| Ligne | Nombre | Tarif | Total |
|---|---|---|---|
| Personnes OU immeubles | `b1` | × 12 € | `b2` (= b1×12) |
| Personnes ET immeubles (flat — query mixte) | — | 12 € | `b3` (= 12 si mixte, sinon vide) |
| — nombre de personnes au-delà de 3 | `b4` | × 5 € | `b5` (= b4×5) |
| — nombre d'immeubles au-delà de 5 | `b6` | × 2 € | `b7` (= b6×2) |
| Frais d'expédition (2 €/envoi ; 0 si courriel) | — | — | **pas de field** → créer via option B |
| **TOTAL** | | | `zc1` = b2 + b3 + b5 + b7 + expédition_calculée |

**`b8`** = field fantôme du PDF, **ignorer** (existe techniquement dans la liste mais ne correspond visuellement à aucune case du bloc coût).

### 3.5 Bloc "Mode de paiement" 3233

**Le 3233 a de vraies checkboxes interactives** (contrairement au 3236) → implémentation propre via `form.getCheckBox('cacX').check()` selon choix UI (radio buttons mutuellement exclusifs).

| Checkbox | Option |
|---|---|
| `cac2` | Carte bancaire |
| `cac3` | Virement |
| `cac4` | Chèque de Banque (ordre Trésor public, > 1000 €) |
| `cac5` | Chèque (ordre Trésor public, max 1000 €) |
| `cac6` | Numéraire (max 300 €) |

(`cac1` = "limiter au dernier propriétaire connu" — voir §3.3)

### 3.6 Feuilles de suite 3233 — V2, hors scope V1

Utilisées si > 3 personnes ou > 5 immeubles. Warning UI en V1, implémentation en V2.

**Bloc "Identification du demandeur (suite)"** — duplicate de `a1`-`a4` (à pré-remplir auto depuis le profil localStorage) :
- `a2a` = identité, `a3a` = adresse L1, `a4a` = adresse L2, `a5a` = adresse L3

**"Identification des personnes (suite)"** — 7 lignes supplémentaires, pattern de 4 fields consécutifs par ligne (N° éditable inclus pour continuer la numérotation `4, 5, 6…`) :

| Ligne | N° (éditable) | Nom | Prénom / Siège ² | Date+lieu / SIREN |
|---|---|---|---|---|
| 1 | `c2` | `c3` | `c4` | `c5` |
| 2 | `c6` | `c7` | `c8` | `c9` |
| 3 | `c10` | `c11` | `c12` | `c13` |
| 4 | `c14` | `c15` | `c16` | `c17` |
| 5 | `c18` | `c19` | `c20` | `c21` |
| 6 | `c22` | `c23` | `c24` | `c25` |
| 7 | `c26` | `c27` | `c28` | `c29` |

**"Désignation des immeubles (suite)"** — 7 lignes, pattern de 5 fields consécutifs :

| Ligne | N° (éditable) | Commune | Réf. cadastrales | N° division vol. | N° lot copropriété |
|---|---|---|---|---|---|
| 1 | `c30` | `c31` | `c32` | `c33` | `c34` |
| 2 | `c35` | `c36` | `c37` | `c38` | `c39` |
| 3 | `c40` | `c41` | `c42` | `c43` | `c44` |
| 4 | `c45` | `c46` | `c47` | `c48` | `c49` |
| 5 | `c50` | `c51` | `c52` | `c53` | `c54` |
| 6 | `c55` | `c56` | `c57` | `c58` | `c59` |
| 7 | `c60` | `c61` | `c62` | `c63` | `c64` |

`c1` et `c65` : probablement champs libres "autre motif" dans les cadres admin. **Non touchés.**

### 3.7 Notes de bas de page 3233 (¹²³⁴)

> **¹** Nom (en majuscules), prénom(s) ou dénomination sociale (en majuscules).
> **²** L'indication du courriel autorise l'administration à vous répondre par courriel.
> **³** Pour les associations ou syndicats, mentionner en outre la date et le lieu de la déclaration ou du dépôt des statuts.
> **⁴** Ou date de rénovation du cadastre pour les demandes portant uniquement sur les immeubles.

### 3.8 Blocs à ne pas toucher (déjà dans le PDF source)

- Cadre réservé à l'administration (motifs de refus)
- Mentions CNIL / légales
- Bandeau République Française / DGFiP / Cerfa 11194*07

---

## 4. Debug scripts

Pour régénérer un PDF debug (fields texte remplis avec leur nom + checkboxes labellisées en rouge à côté de chaque case) :

```bash
cd ~/Genealogy && node -e "
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
(async () => {
  const bytes = fs.readFileSync('public/forms/cerfa-3233-sd.pdf');
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const helv = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const f of form.getFields()) {
    if (f.constructor.name === 'PDFTextField') {
      try { const tf = form.getTextField(f.getName()); tf.setText(f.getName()); tf.updateAppearances(helv); } catch {}
    }
  }
  for (const f of form.getFields()) {
    if (f.constructor.name !== 'PDFCheckBox') continue;
    const name = f.getName();
    for (const w of f.acroField.getWidgets()) {
      const rect = w.getRectangle();
      let pageIndex = 0;
      const pageRef = w.P();
      for (let i = 0; i < pdf.getPageCount(); i++) if (pdf.getPage(i).ref === pageRef) { pageIndex = i; break; }
      pdf.getPage(pageIndex).drawText(name, { x: rect.x + rect.width + 3, y: rect.y + 2, size: 9, font: helv, color: rgb(1, 0, 0) });
    }
  }
  fs.writeFileSync('/tmp/cerfa-3233-sd-DEBUG.pdf', await pdf.save());
})();
"
```

Pour 3236, attention au bouton `notice` qui crashe `save()` avec `updateFieldAppearances: true` — utiliser `updateAppearances(helv)` par field + `save({ updateFieldAppearances: false })`.

---

## 5. Travail restant après cette spec

1. **Refactor `src/lib/pdf-filler.ts`** — remplacer les heuristiques par un mapping explicite `Fill3233Data` / `Fill3236Data` → fields `aXX`/`bXX`/`cacXX`.
2. **Ajouter profil demandeur** (localStorage + petit formulaire d'édition) — pré-remplit `a1`-`a7`.
3. **Refactor `Formulaire3233Modal`** :
   - Supprimer logique actuelle (simple volume/numéro)
   - Ajouter bloc personnes (1-3) via multi-`PersonSelector`
   - Ajouter bloc immeubles (1-5) — saisie manuelle
   - Ajouter bloc période de délivrance (cas général / particulier + checkbox `cac1`)
   - Ajouter bloc coût (auto calc b2, b3, b5, b7, expédition, zc1)
   - Ajouter bloc mode de paiement (radio → `cac2`-`cac6`)
   - Warning `date < 1956`, aide "2 exemplaires si courrier"
   - Notes ¹²³⁴
4. **Refactor `Formulaire3236Modal`** :
   - Supprimer `PersonSelector` et message de guidance
   - Ajouter bloc formalités (1-7) avec bouton "+ Ajouter une formalité"
   - Ajouter bloc coût (auto calc b2/b4/b6/b8/b10/zc1)
   - Ajouter bloc mode de paiement (option A = dessin ✗ sur coords)
   - Notes ¹²³
5. **Mesurer les coordonnées** des zones à compléter (option A ou B selon décision finale) :
   - JJ/MM dates période délivrance 3233 → option B (créer 4 nouveaux fields)
   - Frais expédition total 3233 → option B (créer 1 nouveau field)
   - Cases mode de paiement 3236 → option A (dessin aux coords)
6. **Module signature** — V2 (signature_pad ou zone manuelle).
7. **Vision long terme** : paiement en ligne intégré → obsolète le bloc mode de paiement PDF.
