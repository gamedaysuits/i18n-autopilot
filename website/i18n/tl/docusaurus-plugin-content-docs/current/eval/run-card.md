---
sidebar_position: 4
title: "Espesipikasyon ng Run Card"
---
# Run Card Specification

Ang run card ay ang kumpletong record ng isang evaluation run. Naglalaman po ito ng lahat ng kailangan para maintindihan, ma-reproduce, at ma-verify ang experiment: configuration, scores, individual results, token usage, at environment metadata.

**Schema version:** 2.0

---

## Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 na na-generate sa simula ng run |
| `harness_version` | `string` | Semantic version ng harness na nag-produce ng card na ito (hal., `2.0`) |
| `model_slug` | `string` | OpenRouter model slug na ginamit para sa run (hal., `openai/gpt-4o`) |
| `model_id` | `string` | Resolved model identifier na ibinalik ng API (hal., `gpt-4o-2024-08-06`) |
| `condition` | `string` | Experiment label (hal., `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | ISO 8601 UTC timestamp kung kailan nag-start ang run |
| `elapsed_seconds` | `number` | Wall-clock duration ng buong run |

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

Tinu-tukoy nito ang evaluation dataset at naka-pin ito sa isang specific na content version gamit ang SHA-256.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Dataset identifier (hal., `edtekla-dev-v1`) |
| `version` | `string` | Dataset version string |
| `language_pair` | `string` | Display label (hal., `EN→CRK`) |
| `sha256` | `string` | SHA-256 hash ng contents ng dataset file. Sini-siguro nito ang eksaktong data na ginamit |
| `entry_count` | `number` | Bilang ng entries sa dataset |

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

Ang API at batching configuration na ginamit para sa run na ito.

| Field | Type | Description |
|-------|------|-------------|
| `api_provider` | `string` | Pangalan ng API provider (hal., `openrouter`) |
| `temperature` | `number` | Sampling temperature |
| `max_tokens` | `number` | Maximum tokens per completion |
| `batch_size` | `number` | Entries per concurrent batch |
| `concurrency` | `number` | Maximum parallel API requests |

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

| Field | Type | Description |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | SHA-256 hash ng system prompt. Kasama ito sa fingerprint |
| `system_prompt_used` | `string` | Ang buong system prompt text na ipinadala sa model |

Ang prompt hash ay bahagi ng [fingerprint](#fingerprint) — ang dalawang runs na may magkaibang prompts ay magkakaroon ng magkaibang fingerprints kahit pareho pa ang lahat ng ibang settings.

---

## `fingerprint`

Isang reproducibility identifier. Ang dalawang runs na may parehong fingerprints ay gumamit ng parehong experimental setup.

| Field | Type | Description |
|-------|------|-------------|
| `hash` | `string` | SHA-256 hash ng mga sorted components |
| `components` | `object` | Ang mga input values na na-hash |

### Fingerprint Components

| Component | Description |
|-----------|-------------|
| `dataset_sha256` | Hash ng dataset file |
| `model_slug` | Model na ginamit |
| `condition` | Experiment condition label |
| `system_prompt_sha256` | Hash ng system prompt |
| `temperature` | Sampling temperature |
| `harness_version` | Harness version |

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

:::info Fingerprint ≠ Run Card Hash
Tinu-tukoy ng fingerprint ang *experiment configuration*. Vini-verify naman ng `run_card_hash` ang *result file integrity*. Tingnan po ang [Fingerprint vs Run Card Hash](/docs/eval/harness#fingerprint-vs-run-card-hash) para sa karagdagang detalye.
:::

---

## `scores`

Aggregate metrics para sa buong run.

### Top-Level Scores

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total entries na na-evaluate |
| `exact_matches` | `number` | Entries kung saan ang output ay eksaktong nag-match sa gold standard |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Entries kung saan in-accept ng FST analyzer ang output |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` kung walang FST analyzer na ginamit |
| `chrf_plus_plus` | `number` | Corpus-level chrF++ score (0–100) |
| `errors` | `number` | Entries na nag-fail (API error, timeout, atbp.) |
| `avg_latency_seconds` | `number` | Mean response time across all entries |
| `median_latency_seconds` | `number` | Median response time |
| `p95_latency_seconds` | `number` | 95th percentile response time |

### `by_difficulty`

Scores na naka-breakdown ayon sa difficulty tier. Ang bawat key (`easy`, `medium`, `hard`) ay naglalaman ng parehong metric fields gaya ng top-level scores.

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

Scores na naka-breakdown ayon sa entry provenance. Ang bawat key (hal., `gold_standard`, `textbook`) ay naglalaman ng parehong metric fields.

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

Token usage at cost tracking para sa buong run.

| Field | Type | Description |
|-------|------|-------------|
| `prompt_tokens` | `number` | Total input tokens sa lahat ng API calls |
| `completion_tokens` | `number` | Total output tokens |
| `reasoning_tokens` | `number` | Tokens na ginamit para sa chain-of-thought reasoning (model-dependent, 0 para sa karamihan ng models) |
| `cached_tokens` | `number` | Tokens na sinerve mula sa prompt cache ng provider |
| `total_cost_usd` | `number` | Total cost in USD (ayon sa report ng API) |
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

Runtime environment metadata para sa reproducibility.

| Field | Type | Description |
|-------|------|-------------|
| `harness_version` | `string` | Harness version (ka-mirror ng top-level na `harness_version`) |
| `harness_git_commit` | `string` | Git commit SHA ng harness noong run time |
| `python_version` | `string` | Python interpreter version |
| `sacrebleu_version` | `string` | sacrebleu library version (ginamit para sa chrF++ scoring) |
| `os` | `string` | Operating system identifier |

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

Ang per-entry results array. Isang object bawat dataset entry, in index order.

| Field | Type | Description |
|-------|------|-------------|
| `entry_index` | `number` | Index ng entry na ito sa dataset (nag-mamatch sa `entries[].index`) |
| `source_text` | `string` | Ang source text na na-translate |
| `target_expected` | `string` | Ang gold-standard reference mula sa dataset |
| `target_output` | `string` | Ang actual output ng model |
| `exact_match` | `boolean` | Kung `target_output === target_expected` |
| `entry_chrf` | `number` | Sentence-level chrF++ score para sa entry na ito (0–100) |
| `fst_accepted` | `boolean \| null` | Kung in-accept ng FST analyzer ang output. `null` kung walang analyzer na na-configure |
| `fst_analysis` | `string[]` | FST analysis strings para sa output (empty array kung hindi na-analyze o na-reject) |
| `difficulty` | `string` | Difficulty tier mula sa dataset (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Provenance tag mula sa dataset |
| `latency_seconds` | `number` | Response time para sa individual entry na ito |
| `usage` | `object` | Per-entry token usage: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Error message kung nag-fail ang entry na ito. `null` kung success |

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

| Field | Type | Description |
|-------|------|-------------|
| `run_card_hash` | `string` | SHA-256 hash ng buong run card JSON, kung saan ang `run_card_hash` field mismo ay naka-set sa `""` habang nagha-hash |

Ito po ang tamper-detection seal. Nire-recompute ng leaderboard ang hash na ito upon submission at nire-reject ang mga cards kung saan hindi ito nag-match.

**Pag-compute ng hash:**

1. I-serialize ang run card sa JSON kung saan ang `run_card_hash` ay naka-set sa `""`
2. I-compute ang SHA-256 ng serialized string
3. I-set ang `run_card_hash` sa resulting hex digest

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Tingnan Din

- [MT Evaluation](/docs/eval/) — overview, leaderboard value, at good/bad method guidance
- [Eval Harness](/docs/eval/harness) — paano mag-run ng evaluations at mag-generate ng run cards
- [Evaluation Datasets](/docs/eval/datasets) — dataset format, EDTeKLA, FLORES+
- [Building a Method](/docs/eval/methods) — ang method interface at method card spec
- [Method Leaderboard](/leaderboard) — live benchmark scores