---
sidebar_position: 4
title: "Spécification de la Run Card"
---
# Spécification de la Run Card

La Run Card est l'enregistrement complet d'une seule exécution d'évaluation. Elle contient tout ce qui est nécessaire pour comprendre, reproduire et vérifier l'expérience : la configuration, les scores, les résultats individuels, l'utilisation des jetons et les métadonnées de l'environnement.

**Version du schéma :** 2.0

---

## Champs de premier niveau

| Champ | Type | Description |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 généré au début de l'exécution |
| `harness_version` | `string` | Version sémantique du harnais (harness) ayant produit cette fiche (par ex., `2.0`) |
| `model_slug` | `string` | Identifiant (slug) du modèle OpenRouter utilisé pour l'exécution (par ex., `openai/gpt-4o`) |
| `model_id` | `string` | Identifiant résolu du modèle renvoyé par l'API (par ex., `gpt-4o-2024-08-06`) |
| `condition` | `string` | Étiquette de l'expérience (par ex., `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | Horodatage UTC au format ISO 8601 du début de l'exécution |
| `elapsed_seconds` | `number` | Durée réelle (wall-clock) de l'ensemble de l'exécution |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

Identifie le jeu de données d'évaluation et le fixe à une version de contenu spécifique via SHA-256.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant du jeu de données (par ex., `edtekla-dev-v1`) |
| `version` | `string` | Chaîne de caractères de la version du jeu de données |
| `language_pair` | `string` | Étiquette d'affichage (par ex., `EN→CRK`) |
| `sha256` | `string` | Empreinte (hash) SHA-256 du contenu du fichier du jeu de données. Garantit les données exactes utilisées |
| `entry_count` | `number` | Nombre d'entrées dans le jeu de données |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

La configuration de l'API et du traitement par lots (batching) utilisée pour cette exécution.

| Champ | Type | Description |
|-------|------|-------------|
| `api_provider` | `string` | Nom du fournisseur de l'API (par ex., `openrouter`) |
| `temperature` | `number` | Température d'échantillonnage |
| `max_tokens` | `number` | Nombre maximum de jetons (tokens) par complétion |
| `batch_size` | `number` | Entrées par lot simultané |
| `concurrency` | `number` | Nombre maximum de requêtes API parallèles |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| Champ | Type | Description |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | Empreinte SHA-256 de l'invite système (system prompt). Incluse dans l'empreinte digitale (fingerprint) |
| `system_prompt_used` | `string` | Le texte complet de l'invite système envoyé au modèle |

L'empreinte de l'invite fait partie de l'[empreinte digitale](#fingerprint) — deux exécutions avec des invites différentes auront des empreintes digitales différentes même si tous les autres paramètres correspondent.

---

## `fingerprint`

Un identifiant de reproductibilité. Deux exécutions avec des empreintes digitales identiques ont utilisé la même configuration expérimentale.

| Champ | Type | Description |
|-------|------|-------------|
| `hash` | `string` | Empreinte SHA-256 des composants triés |
| `components` | `object` | Les valeurs d'entrée qui ont été hachées |

### Composants de l'empreinte digitale

| Composant | Description |
|-----------|-------------|
| `dataset_sha256` | Empreinte du fichier du jeu de données |
| `model_slug` | Modèle utilisé |
| `condition` | Étiquette de la condition de l'expérience |
| `system_prompt_sha256` | Empreinte de l'invite système |
| `temperature` | Température d'échantillonnage |
| `harness_version` | Version du harnais |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info Empreinte digitale ≠ Empreinte de la Run Card
L'empreinte digitale identifie la *configuration de l'expérience*. Le `run_card_hash` vérifie l'*intégrité du fichier de résultats*. Consultez [Empreinte digitale vs Empreinte de la Run Card](/docs/eval/harness#fingerprint-vs-run-card-hash) pour plus de détails.
:::

---

## `scores`

Métriques agrégées pour l'ensemble de l'exécution.

### Scores de premier niveau

| Champ | Type | Description |
|-------|------|-------------|
| `total` | `number` | Nombre total d'entrées évaluées |
| `exact_matches` | `number` | Entrées dont la sortie correspondait exactement à la référence (gold standard) |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Entrées pour lesquelles l'analyseur FST a accepté la sortie |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` si aucun analyseur FST n'a été utilisé |
| `chrf_plus_plus` | `number` | Score chrF++ au niveau du corpus (0–100) |
| `errors` | `number` | Entrées ayant échoué (erreur d'API, délai d'attente dépassé, etc.) |
| `avg_latency_seconds` | `number` | Temps de réponse moyen sur l'ensemble des entrées |
| `median_latency_seconds` | `number` | Temps de réponse médian |
| `p95_latency_seconds` | `number` | Temps de réponse au 95e centile |

### `by_difficulty`

Scores répartis par niveau de difficulté. Chaque clé (`easy`, `medium`, `hard`) contient les mêmes champs de métriques que les scores de premier niveau.

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

Scores répartis par provenance des entrées. Chaque clé (par ex., `gold_standard`, `textbook`) contient les mêmes champs de métriques.

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

Suivi de l'utilisation des jetons et des coûts pour l'ensemble de l'exécution.

| Champ | Type | Description |
|-------|------|-------------|
| `prompt_tokens` | `number` | Nombre total de jetons d'entrée sur l'ensemble des appels API |
| `completion_tokens` | `number` | Nombre total de jetons de sortie |
| `reasoning_tokens` | `number` | Jetons utilisés pour le raisonnement par chaîne de pensée (chain-of-thought) (dépend du modèle, 0 pour la plupart des modèles) |
| `cached_tokens` | `number` | Jetons servis depuis le cache d'invites du fournisseur |
| `total_cost_usd` | `number` | Coût total en USD (tel que rapporté par l'API) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

Métadonnées de l'environnement d'exécution pour la reproductibilité.

| Champ | Type | Description |
|-------|------|-------------|
| `harness_version` | `string` | Version du harnais (reflète le `harness_version` de premier niveau) |
| `harness_git_commit` | `string` | Empreinte SHA du commit Git du harnais au moment de l'exécution |
| `python_version` | `string` | Version de l'interpréteur Python |
| `sacrebleu_version` | `string` | Version de la bibliothèque sacrebleu (utilisée pour le calcul du score chrF++) |
| `os` | `string` | Identifiant du système d'exploitation |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

Le tableau des résultats par entrée. Un objet par entrée du jeu de données, dans l'ordre des index.

| Champ | Type | Description |
|-------|------|-------------|
| `entry_index` | `number` | Index de cette entrée dans le jeu de données (correspond à `entries[].index`) |
| `source_text` | `string` | Le texte source qui a été traduit |
| `target_expected` | `string` | La référence (gold standard) issue du jeu de données |
| `target_output` | `string` | La sortie réelle du modèle |
| `exact_match` | `boolean` | Indique si `target_output === target_expected` |
| `entry_chrf` | `number` | Score chrF++ au niveau de la phrase pour cette entrée (0–100) |
| `fst_accepted` | `boolean \| null` | Indique si l'analyseur FST a accepté la sortie. `null` si aucun analyseur n'a été configuré |
| `fst_analysis` | `string[]` | Chaînes d'analyse FST pour la sortie (tableau vide si non analysé ou rejeté) |
| `difficulty` | `string` | Niveau de difficulté issu du jeu de données (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Balise de provenance issue du jeu de données |
| `latency_seconds` | `number` | Temps de réponse pour cette entrée individuelle |
| `usage` | `object` | Utilisation des jetons par entrée : `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Message d'erreur si cette entrée a échoué. `null` en cas de succès |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| Champ | Type | Description |
|-------|------|-------------|
| `run_card_hash` | `string` | Empreinte SHA-256 de l'ensemble du JSON de la Run Card, avec le champ `run_card_hash` lui-même défini sur `""` lors du hachage |

Il s'agit du sceau de détection d'altération. Le classement (leaderboard) recalcule cette empreinte lors de la soumission et rejette les fiches pour lesquelles elle ne correspond pas.

**Calcul de l'empreinte :**

1. Sérialisez la Run Card en JSON avec `run_card_hash` défini sur `""`
2. Calculez le SHA-256 de la chaîne sérialisée
3. Définissez `run_card_hash` sur le condensat hexadécimal (hex digest) résultant

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Voir aussi

- [Évaluation de la MT](/docs/eval/) — aperçu, valeur du classement et conseils sur les bonnes/mauvaises méthodes
- [Harnais d'évaluation (Eval Harness)](/docs/eval/harness) — comment exécuter des évaluations et générer des Run Cards
- [Jeux de données d'évaluation](/docs/eval/datasets) — format des jeux de données, EDTeKLA, FLORES+
- [Création d'une méthode](/docs/eval/methods) — l'interface de la méthode et la spécification de la fiche de méthode (Method Card)
- [Classement des méthodes](/leaderboard) — scores de référence (benchmark) en direct