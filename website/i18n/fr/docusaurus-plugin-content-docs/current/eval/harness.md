---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

Le harness exécute des expériences de traduction et produit des run cards. Il gère la construction des prompts, les appels d'API, l'évaluation (scoring) et la sérialisation des résultats — vous fournissez le jeu de données et le modèle.

## Installation

**Prérequis :** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

Clonez le dépôt du harness :

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Utilisation

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Ceci traite chaque entrée du jeu de données via le modèle configuré, évalue les sorties et écrit un fichier JSON de run card dans le répertoire `results/`.

## Options CLI

| Option | Requis | Par défaut | Description |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Chemin vers le fichier JSON du jeu de données d'évaluation |
| `--model` | — | `openai/gpt-4o` | Identifiant (slug) du modèle OpenRouter (par ex., `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Étiquette de l'expérience. Utilisée pour distinguer les stratégies de prompt (par ex., `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Température d'échantillonnage. Plus basse = plus déterministe |
| `--batch-size` | — | `5` | Nombre d'entrées par lot d'appels API simultanés |
| `--fst-analyzer` | — | `null` | Chemin vers un binaire d'analyseur FST. Lorsqu'il est fourni, chaque sortie est testée pour son acceptation morphologique |
| `--submit` | — | `false` | Soumettre la run card à l'API du leaderboard une fois l'exécution terminée |

### Exemples

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## Schéma de la Run Card

Chaque expérience produit une **run card** — un document JSON autonome. La structure de premier niveau est la suivante :

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

Consultez la [Spécification de la Run Card](/docs/eval/run-card) pour obtenir le schéma complet avec chaque champ documenté.

### Blocs clés

**`dataset`** — Identifie le jeu de données utilisé, y compris le hachage (hash) de son contenu, afin que les résultats soient liés à une version spécifique :

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Métriques agrégées pour l'exécution :

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — Suivi de l'utilisation des tokens et des coûts :

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## Empreinte (Fingerprint) vs Hachage de la Run Card

Le harness produit deux hachages distincts. Ils servent des objectifs différents :

### Empreinte (Fingerprint)

L'**empreinte** répond à la question : *"Cette exécution pourrait-elle être reproduite ?"*

Elle hache la combinaison d'entrées qui définissent la configuration de l'expérience — et non les sorties :

- SHA-256 du jeu de données
- Identifiant (slug) du modèle
- Étiquette de condition
- SHA-256 du prompt système
- Température
- Version du harness

Deux exécutions avec des empreintes identiques ont utilisé la même configuration. Leurs résultats devraient être comparables (modulo le non-déterminisme de l'API).

### Hachage de la Run Card

Le **hachage de la run card** répond à la question : *"Ce fichier de résultats spécifique a-t-il été altéré ?"*

Il s'agit du SHA-256 de l'intégralité du JSON de la run card (à l'exclusion du champ `run_card_hash` lui-même). Si un seul champ est modifié — un score, un horodatage, une seule sortie —, le hachage devient invalide.

:::info Quand utiliser l'un ou l'autre
Utilisez l'**empreinte** pour regrouper des exécutions comparables (même expérience, différentes exécutions). Utilisez le **hachage de la run card** pour vérifier l'intégrité d'un fichier de résultats spécifique.
:::

---

## Soumission au Leaderboard

### Soumission automatique

Passez `--submit` pour téléverser la run card à la fin de l'exécution :

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Soumission manuelle

Les run cards sont enregistrées sous forme de fichiers JSON dans `results/`. Vous pouvez soumettre n'importe quel fichier de run card via l'interface utilisateur du leaderboard sur [/leaderboard](/leaderboard), ou via l'API :

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Validation du leaderboard
Le leaderboard valide les run cards soumises par rapport au registre des jeux de données. Les soumissions faisant référence à des jeux de données inconnus, ou présentant un `run_card_hash` invalide, sont rejetées.
:::

:::danger NE VOUS ENTRAÎNEZ PAS sur les données d'évaluation
Si votre méthode a été exposée au jeu de données d'évaluation pendant son développement — en tant que données d'entraînement, exemples few-shot, entrées de dictionnaire ou matériel de prompt engineering —, votre soumission sera **disqualifiée**. Consultez [MT Evaluation](/docs/eval/) pour savoir ce qui différencie une bonne d'une mauvaise méthode.
:::

---

## Voir aussi

- [MT Evaluation](/docs/eval/) — aperçu, proposition de valeur du leaderboard et conseils sur les bonnes/mauvaises méthodes
- [Jeux de données d'évaluation](/docs/eval/datasets) — format des jeux de données, EDTeKLA, FLORES+
- [Spécification de la Run Card](/docs/eval/run-card) — le schéma JSON complet
- [Création d'une méthode](/docs/eval/methods) — l'interface de méthode pour créer des méthodes évaluables
- [Classement des méthodes](/leaderboard) — scores de référence (benchmark) en direct