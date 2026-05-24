---
sidebar_position: 4
title: "Run Card Specificatie"
---
# Run Card-specificatie

De run card is de volledige registratie van een enkele evaluatierun. Het bevat alles wat nodig is om het experiment te begrijpen, te reproduceren en te verifiëren: configuratie, scores, individuele resultaten, tokengebruik en omgevingsmetadata.

**Schemaversie:** 2.0

---

## Top-level velden

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 gegenereerd aan het begin van de run |
| `harness_version` | `string` | Semantische versie van de harness die deze card heeft geproduceerd (bijv. `2.0`) |
| `model_slug` | `string` | OpenRouter model-slug gebruikt voor de run (bijv. `openai/gpt-4o`) |
| `model_id` | `string` | Opgeloste model-identifier geretourneerd door de API (bijv. `gpt-4o-2024-08-06`) |
| `condition` | `string` | Experimentlabel (bijv. `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | ISO 8601 UTC-tijdstempel van wanneer de run is gestart |
| `elapsed_seconds` | `number` | Totale doorlooptijd van de gehele run |

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

Identificeert de evaluatiedataset en koppelt deze aan een specifieke contentversie via SHA-256.

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `id` | `string` | Dataset-identifier (bijv. `edtekla-dev-v1`) |
| `version` | `string` | Dataset-versiestring |
| `language_pair` | `string` | Weergavelabel (bijv. `EN→CRK`) |
| `sha256` | `string` | SHA-256-hash van de inhoud van het datasetbestand. Garandeert de exacte data die is gebruikt |
| `entry_count` | `number` | Aantal items in de dataset |

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

De API- en batchingconfiguratie die voor deze run is gebruikt.

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `api_provider` | `string` | Naam van de API-provider (bijv. `openrouter`) |
| `temperature` | `number` | Sampling-temperatuur |
| `max_tokens` | `number` | Maximum aantal tokens per voltooiing |
| `batch_size` | `number` | Items per gelijktijdige batch |
| `concurrency` | `number` | Maximum aantal parallelle API-verzoeken |

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

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | SHA-256-hash van de systeemprompt. Opgenomen in de fingerprint |
| `system_prompt_used` | `string` | De volledige tekst van de systeemprompt die naar het model is verzonden |

De prompt-hash maakt deel uit van de [fingerprint](#fingerprint) — twee runs met verschillende prompts zullen verschillende fingerprints hebben, zelfs als alle andere instellingen overeenkomen.

---

## `fingerprint`

Een reproduceerbaarheids-identifier. Twee runs met identieke fingerprints hebben dezelfde experimentele opzet gebruikt.

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `hash` | `string` | SHA-256-hash van de gesorteerde componenten |
| `components` | `object` | De invoerwaarden die zijn gehasht |

### Fingerprint-componenten

| Component | Beschrijving |
|-----------|-------------|
| `dataset_sha256` | Hash van het datasetbestand |
| `model_slug` | Gebruikt model |
| `condition` | Label van de experimentvoorwaarde |
| `system_prompt_sha256` | Hash van de systeemprompt |
| `temperature` | Sampling-temperatuur |
| `harness_version` | Harness-versie |

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

:::info Fingerprint ≠ Run Card-hash
De fingerprint identificeert de *experimentconfiguratie*. De `run_card_hash` verifieert de *integriteit van het resultaatbestand*. Zie [Fingerprint vs Run Card-hash](/docs/eval/harness#fingerprint-vs-run-card-hash) voor meer informatie.
:::

---

## `scores`

Geaggregeerde metrieken voor de gehele run.

### Top-level scores

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `total` | `number` | Totaal aantal geëvalueerde items |
| `exact_matches` | `number` | Items waarbij de uitvoer exact overeenkwam met de gouden standaard |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Items waarbij de FST-analyzer de uitvoer heeft geaccepteerd |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` als er geen FST-analyzer is gebruikt |
| `chrf_plus_plus` | `number` | chrF++-score op corpusniveau (0–100) |
| `errors` | `number` | Items die zijn mislukt (API-fout, time-out, enz.) |
| `avg_latency_seconds` | `number` | Gemiddelde responstijd over alle items |
| `median_latency_seconds` | `number` | Mediane responstijd |
| `p95_latency_seconds` | `number` | 95e percentiel responstijd |

### `by_difficulty`

Scores uitgesplitst naar moeilijkheidsgraad. Elke sleutel (`easy`, `medium`, `hard`) bevat dezelfde metriekvelden als de top-level scores.

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

Scores uitgesplitst naar herkomst van het item. Elke sleutel (bijv. `gold_standard`, `textbook`) bevat dezelfde metriekvelden.

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

Tokengebruik en kostenregistratie voor de gehele run.

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `prompt_tokens` | `number` | Totaal aantal invoertokens over alle API-aanroepen |
| `completion_tokens` | `number` | Totaal aantal uitvoertokens |
| `reasoning_tokens` | `number` | Tokens gebruikt voor chain-of-thought redenering (modelafhankelijk, 0 voor de meeste modellen) |
| `cached_tokens` | `number` | Tokens geleverd vanuit de prompt-cache van de provider |
| `total_cost_usd` | `number` | Totale kosten in USD (zoals gerapporteerd door de API) |
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

Metadata van de runtime-omgeving voor reproduceerbaarheid.

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `harness_version` | `string` | Harness-versie (weerspiegelt top-level `harness_version`) |
| `harness_git_commit` | `string` | Git commit-SHA van de harness tijdens de run |
| `python_version` | `string` | Versie van de Python-interpreter |
| `sacrebleu_version` | `string` | Versie van de sacrebleu-bibliotheek (gebruikt voor chrF++-scores) |
| `os` | `string` | Identifier van het besturingssysteem |

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

De array met resultaten per item. Eén object per dataset-item, in volgorde van index.

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `entry_index` | `number` | Index van dit item in de dataset (komt overeen met `entries[].index`) |
| `source_text` | `string` | De brontekst die is vertaald |
| `target_expected` | `string` | De gouden standaard-referentie uit de dataset |
| `target_output` | `string` | De daadwerkelijke uitvoer van het model |
| `exact_match` | `boolean` | Of `target_output === target_expected` |
| `entry_chrf` | `number` | chrF++-score op zinsniveau voor dit item (0–100) |
| `fst_accepted` | `boolean \| null` | Of de FST-analyzer de uitvoer heeft geaccepteerd. `null` als er geen analyzer was geconfigureerd |
| `fst_analysis` | `string[]` | FST-analysestrings voor de uitvoer (lege array indien niet geanalyseerd of afgewezen) |
| `difficulty` | `string` | Moeilijkheidsgraad uit de dataset (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Herkomst-tag uit de dataset |
| `latency_seconds` | `number` | Responstijd voor dit individuele item |
| `usage` | `object` | Tokengebruik per item: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Foutmelding als dit item is mislukt. `null` bij succes |

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

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `run_card_hash` | `string` | SHA-256-hash van de volledige Run Card-JSON, waarbij het veld `run_card_hash` zelf is ingesteld op `""` tijdens het hashen |

Dit is de verzegeling voor fraudedetectie. Het leaderboard berekent deze hash opnieuw bij indiening en weigert cards waarbij deze niet overeenkomt.

**De hash berekenen:**

1. Serialiseer de Run Card naar JSON met `run_card_hash` ingesteld op `""`
2. Bereken de SHA-256 van de geserialiseerde string
3. Stel `run_card_hash` in op de resulterende hex-digest

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Zie ook

- [MT-evaluatie](/docs/eval/) — overzicht, waarde van het leaderboard en richtlijnen voor goede/slechte methoden
- [Eval Harness](/docs/eval/harness) — hoe u evaluaties uitvoert en Run Cards genereert
- [Evaluatiedatasets](/docs/eval/datasets) — datasetformaat, EDTeKLA, FLORES+
- [Een methode bouwen](/docs/eval/methods) — de methode-interface en specificatie van de Method Card
- [Methode-leaderboard](/leaderboard) — live benchmarkscores