---
sidebar_position: 3
title: "Jeux de données d'évaluation"
---
# Jeux de données d'évaluation

Les jeux de données constituent les cibles fixes sur lesquelles le harness est exécuté. Chaque jeu de données est un fichier JSON contenant des paires source→cible accompagnées de références gold-standard. Le harness évalue les résultats du modèle par rapport à ces références — il ne les modifie jamais.

:::danger NE PAS ENTRAÎNER sur les données d'évaluation

⚠️ **Ces jeux de données sont exclusivement destinés à l'évaluation.** Les méthodes entraînées, ajustées (fine-tuned), sollicitées par quelques exemples (few-shot-prompted) ou autrement exposées aux données d'évaluation produiront des scores artificiellement gonflés et seront **disqualifiées du leaderboard.**

Utilisez des corpus distincts pour l'entraînement. Les ensembles d'évaluation doivent rester invisibles pour votre modèle pendant le développement.
:::

---

## Format du jeu de données

Chaque jeu de données suit le même schéma JSON :

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### Bloc de niveau supérieur `dataset`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique du jeu de données (utilisé dans les run cards et le leaderboard) |
| `version` | `string` | Version sémantique. Son incrémentation invalide les comparaisons antérieures de run cards |
| `language_pair` | `string` | Étiquette d'affichage (par ex., `EN→CRK`) |
| `description` | `string` | Résumé lisible par un humain |
| `source_language` | `string` | Code de la langue source BCP 47 |
| `target_language` | `string` | Code de la langue cible BCP 47 |
| `created` | `string` | Date de création ISO 8601 |
| `license` | `string` | Identifiant de licence SPDX |
| `provenance` | `string[]` | Liste des balises de provenance utilisées dans les entrées |

### Champs d'entrée

| Champ | Type | Description |
|-------|------|-------------|
| `index` | `number` | Index d'entrée basé sur zéro. Doit être unique et séquentiel |
| `source_text` | `string` | Le texte source à traduire |
| `target_expected` | `string` | La traduction de référence gold-standard |
| `difficulty` | `string` | Niveau de difficulté : `easy`, `medium`, `hard` |
| `provenance` | `string` | Origine de cette entrée (par ex., `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Contexte facultatif pour les réviseurs humains |

---

## Jeux de données disponibles

### EDTeKLA Development Set v1

Le premier jeu de données d'évaluation, conçu pour la traduction de l'anglais vers le cri des plaines (SRO). Créé par le [groupe de recherche EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) de l'Université de l'Alberta.

| Propriété | Valeur |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Version** | `1.0` |
| **Paire de langues** | EN → CRK (Cri des plaines, orthographe SRO) |
| **Nombre d'entrées** | 124 |
| **Répartition des difficultés** | Facile, Moyen, Difficile |
| **Provenance** | `gold_standard` (vérifié par des locuteurs), `textbook` (matériel pédagogique publié) |
| **Licence** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Ce qu'il évalue :**

- Salutations de base et phrases courantes
- Animacité des noms et obviation
- Conjugaison des verbes selon les personnes et les temps
- Constructions locatives
- Paradigmes possessifs
- Structures de phrases complexes

:::tip Pourquoi 124 entrées ?
Le jeu de données est délibérément restreint et soigneusement sélectionné. Chaque entrée a été vérifiée par des locuteurs parlant couramment la langue ou provient de manuels d'apprentissage de la langue crie publiés. Un petit jeu de données de haute qualité avec des références gold-standard vérifiées est plus utile qu'un grand jeu de données bruité — en particulier pour une langue dotée de peu de ressources où les traductions « assez proches » sont souvent morphologiquement invalides.
:::

---

## Création d'un nouveau jeu de données

Pour créer un jeu de données destiné à une nouvelle paire de langues ou à un nouveau domaine :

### 1. Structurer le JSON

Suivez le schéma du [Format du jeu de données](#dataset-format). Chaque entrée doit comporter `source_text`, `target_expected`, `difficulty` et `provenance`.

### 2. Attribuer un ID unique

Utilisez un identifiant (slug) descriptif : `{project}-{split}-v{version}` (par ex., `edtekla-dev-v1`, `quechua-test-v1`).

### 3. Vérifier les références gold-standard

Chaque valeur `target_expected` doit être vérifiée par un locuteur parlant couramment la langue ou provenir d'une ressource publiée et évaluée par des pairs. Les références générées par des machines vont à l'encontre de l'objectif de l'évaluation.

### 4. Définir les niveaux de difficulté

Attribuez un niveau de difficulté à chaque entrée :

| Niveau | Critères |
|------|----------|
| `easy` | Phrases courtes, vocabulaire courant, morphologie simple |
| `medium` | Phrases complètes, complexité morphologique modérée |
| `hard` | Grammaire complexe, constructions rares, contenu culturellement spécifique |

### 5. Baliser la provenance

Chaque entrée doit indiquer sa provenance. Balises courantes :

- `gold_standard` — Vérifié par des locuteurs parlant couramment la langue
- `textbook` — Issu de matériel pédagogique publié
- `elicited` — Produit lors de sessions d'élicitation structurées
- `corpus` — Extrait d'un corpus parallèle

### 6. Valider le fichier

Exécutez le harness sur votre jeu de données avec n'importe quel modèle pour vérifier que le JSON est bien formé et que tous les champs requis sont présents :

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

Le harness renverra une erreur en cas de champs manquants, d'index en double ou de violations du schéma.

### 7. Soumettre pour inclusion

Ouvrez une pull request sur le [dépôt du eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness) avec votre fichier de jeu de données dans le répertoire `data/`. Incluez la documentation de votre méthodologie de vérification et de vos sources de provenance.

---

## FLORES+ Devtest

Un benchmark multilingue à large couverture maintenu par l'[Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Utilisé pour le benchmark frontière multi-modèles de rosetta.

| Propriété | Valeur |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Paires de langues** | EN → 39 langues (toutes les langues naturelles enregistrées dans rosetta) |
| **Nombre d'entrées** | 1 012 phrases par langue |
| **Licence** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Source** | À l'origine Meta FLORES-200, désormais maintenu par OLDI |
| **Emplacement** | Fixtures pré-extraites à `test/benchmark/fixtures/` dans le dépôt principal de rosetta |

:::danger Évaluation uniquement
FLORES+ est destiné exclusivement à l'évaluation. Les conservateurs demandent explicitement qu'il **ne soit pas utilisé comme données d'entraînement**. Assurez-vous que son contenu est exclu de tout corpus d'entraînement.
:::

---

## Voir aussi

- [Évaluation de la traduction automatique (MT)](/docs/eval/) — aperçu du cadre d'évaluation et du leaderboard
- [Eval Harness](/docs/eval/harness) — comment exécuter des évaluations sur ces jeux de données
- [Spécification des Run Cards](/docs/eval/run-card) — le schéma JSON pour l'enregistrement des résultats
- [Leaderboard des méthodes](/leaderboard) — scores des benchmarks en direct
- [Projet EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) — le groupe de recherche de l'Université de l'Alberta à l'origine du jeu de données cri