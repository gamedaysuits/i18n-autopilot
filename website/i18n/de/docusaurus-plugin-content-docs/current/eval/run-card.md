---
sidebar_position: 4
title: "Run-Card-Spezifikation"
---
# Spezifikation der Run Card

Die Run Card ist die vollständige Aufzeichnung eines einzelnen Evaluierungsdurchlaufs. Sie enthält alles, was erforderlich ist, um das Experiment zu verstehen, zu reproduzieren und zu verifizieren: Konfiguration, Bewertungen, Einzelergebnisse, Token-Nutzung und Umgebungs-Metadaten.

**Schema-Version:** 2.0

---

## Felder der obersten Ebene

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `run_id` | `string` | UUID v4, die zu Beginn des Durchlaufs generiert wurde |
| `harness_version` | `string` | Semantische Version des Harness, das diese Card erstellt hat (z. B. `2.0`) |
| `model_slug` | `string` | OpenRouter-Modell-Slug, der für den Durchlauf verwendet wurde (z. B. `openai/gpt-4o`) |
| `model_id` | `string` | Aufgelöster Modell-Identifikator, der von der API zurückgegeben wurde (z. B. `gpt-4o-2024-08-06`) |
| `condition` | `string` | Experiment-Bezeichnung (z. B. `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | ISO-8601-UTC-Zeitstempel des Starts des Durchlaufs |
| `elapsed_seconds` | `number` | Tatsächliche Dauer (Wall-Clock-Zeit) des gesamten Durchlaufs |

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

Identifiziert den Evaluierungsdatensatz und bindet ihn über SHA-256 an eine spezifische Inhaltsversion.

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `id` | `string` | Datensatz-Identifikator (z. B. `edtekla-dev-v1`) |
| `version` | `string` | Versionszeichenfolge des Datensatzes |
| `language_pair` | `string` | Anzeigebezeichnung (z. B. `EN→CRK`) |
| `sha256` | `string` | SHA-256-Hash des Inhalts der Datensatzdatei. Garantiert die exakt verwendeten Daten |
| `entry_count` | `number` | Anzahl der Einträge im Datensatz |

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

Die für diesen Durchlauf verwendete API- und Batching-Konfiguration.

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `api_provider` | `string` | Name des API-Anbieters (z. B. `openrouter`) |
| `temperature` | `number` | Sampling-Temperatur |
| `max_tokens` | `number` | Maximale Token pro Vervollständigung |
| `batch_size` | `number` | Einträge pro gleichzeitigem Batch |
| `concurrency` | `number` | Maximale parallele API-Anfragen |

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

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | SHA-256-Hash des System-Prompts. Im Fingerabdruck enthalten |
| `system_prompt_used` | `string` | Der vollständige Text des System-Prompts, der an das Modell gesendet wurde |

Der Prompt-Hash ist Teil des [Fingerabdrucks](#fingerprint) — zwei Durchläufe mit unterschiedlichen Prompts haben unterschiedliche Fingerabdrücke, selbst wenn alle anderen Einstellungen übereinstimmen.

---

## `fingerprint`

Ein Identifikator für die Reproduzierbarkeit. Zwei Durchläufe mit identischen Fingerabdrücken verwendeten denselben experimentellen Aufbau.

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `hash` | `string` | SHA-256-Hash der sortierten Komponenten |
| `components` | `object` | Die Eingabewerte, die gehasht wurden |

### Komponenten des Fingerabdrucks

| Komponente | Beschreibung |
|-----------|-------------|
| `dataset_sha256` | Hash der Datensatzdatei |
| `model_slug` | Verwendetes Modell |
| `condition` | Bezeichnung der Experimentbedingung |
| `system_prompt_sha256` | Hash des System-Prompts |
| `temperature` | Sampling-Temperatur |
| `harness_version` | Harness-Version |

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

:::info Fingerabdruck ≠ Run-Card-Hash
Der Fingerabdruck identifiziert die *Experimentkonfiguration*. Der `run_card_hash` verifiziert die *Integrität der Ergebnisdatei*. Weitere Details finden Sie unter [Fingerabdruck vs. Run-Card-Hash](/docs/eval/harness#fingerprint-vs-run-card-hash).
:::

---

## `scores`

Aggregierte Metriken für den gesamten Durchlauf.

### Bewertungen der obersten Ebene

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `total` | `number` | Gesamtzahl der evaluierten Einträge |
| `exact_matches` | `number` | Einträge, bei denen die Ausgabe exakt mit dem Goldstandard übereinstimmte |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Einträge, bei denen der FST-Analysator die Ausgabe akzeptiert hat |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null`, wenn kein FST-Analysator verwendet wurde |
| `chrf_plus_plus` | `number` | chrF++-Bewertung auf Korpus-Ebene (0–100) |
| `errors` | `number` | Fehlgeschlagene Einträge (API-Fehler, Zeitüberschreitung usw.) |
| `avg_latency_seconds` | `number` | Mittlere Antwortzeit über alle Einträge hinweg |
| `median_latency_seconds` | `number` | Mediane Antwortzeit |
| `p95_latency_seconds` | `number` | 95. Perzentil der Antwortzeit |

### `by_difficulty`

Bewertungen, aufgeschlüsselt nach Schwierigkeitsgrad. Jeder Schlüssel (`easy`, `medium`, `hard`) enthält dieselben Metrikfelder wie die Bewertungen der obersten Ebene.

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

Bewertungen, aufgeschlüsselt nach Herkunft der Einträge. Jeder Schlüssel (z. B. `gold_standard`, `textbook`) enthält dieselben Metrikfelder.

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

Token-Nutzung und Kostenverfolgung für den gesamten Durchlauf.

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `prompt_tokens` | `number` | Gesamte Eingabe-Token über alle API-Aufrufe hinweg |
| `completion_tokens` | `number` | Gesamte Ausgabe-Token |
| `reasoning_tokens` | `number` | Token, die für Chain-of-Thought-Reasoning verwendet wurden (modellabhängig, 0 bei den meisten Modellen) |
| `cached_tokens` | `number` | Token, die aus dem Prompt-Cache des Anbieters bereitgestellt wurden |
| `total_cost_usd` | `number` | Gesamtkosten in USD (wie von der API gemeldet) |
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

Metadaten der Laufzeitumgebung für die Reproduzierbarkeit.

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `harness_version` | `string` | Harness-Version (spiegelt `harness_version` der obersten Ebene wider) |
| `harness_git_commit` | `string` | Git-Commit-SHA des Harness zur Laufzeit |
| `python_version` | `string` | Version des Python-Interpreters |
| `sacrebleu_version` | `string` | Version der sacrebleu-Bibliothek (verwendet für die chrF++-Bewertung) |
| `os` | `string` | Identifikator des Betriebssystems |

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

Das Array der Ergebnisse pro Eintrag. Ein Objekt pro Datensatz-Eintrag, in der Reihenfolge des Index.

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `entry_index` | `number` | Index dieses Eintrags im Datensatz (entspricht `entries[].index`) |
| `source_text` | `string` | Der Quelltext, der übersetzt wurde |
| `target_expected` | `string` | Die Goldstandard-Referenz aus dem Datensatz |
| `target_output` | `string` | Die tatsächliche Ausgabe des Modells |
| `exact_match` | `boolean` | Ob `target_output === target_expected` |
| `entry_chrf` | `number` | chrF++-Bewertung auf Satzebene für diesen Eintrag (0–100) |
| `fst_accepted` | `boolean \| null` | Ob der FST-Analysator die Ausgabe akzeptiert hat. `null`, wenn kein Analysator konfiguriert wurde |
| `fst_analysis` | `string[]` | FST-Analyse-Zeichenfolgen für die Ausgabe (leeres Array, falls nicht analysiert oder abgelehnt) |
| `difficulty` | `string` | Schwierigkeitsgrad aus dem Datensatz (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Herkunfts-Tag aus dem Datensatz |
| `latency_seconds` | `number` | Antwortzeit für diesen einzelnen Eintrag |
| `usage` | `object` | Token-Nutzung pro Eintrag: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Fehlermeldung, falls dieser Eintrag fehlgeschlagen ist. `null` bei Erfolg |

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

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `run_card_hash` | `string` | SHA-256-Hash der gesamten Run-Card-JSON, wobei das Feld `run_card_hash` selbst während des Hashings auf `""` gesetzt ist |

Dies ist das Siegel zur Manipulationserkennung. Das Leaderboard berechnet diesen Hash bei der Einreichung neu und lehnt Cards ab, bei denen er nicht übereinstimmt.

**Berechnung des Hashes:**

1. Serialisieren Sie die Run Card zu JSON, wobei `run_card_hash` auf `""` gesetzt ist
2. Berechnen Sie den SHA-256-Hash der serialisierten Zeichenfolge
3. Setzen Sie `run_card_hash` auf den resultierenden Hex-Digest

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Siehe auch

- [MT-Evaluierung](/docs/eval/) — Übersicht, Wert für das Leaderboard und Leitfaden für gute/schlechte Methoden
- [Eval Harness](/docs/eval/harness) — Wie Sie Evaluierungen durchführen und Run Cards generieren
- [Evaluierungsdatensätze](/docs/eval/datasets) — Datensatzformat, EDTeKLA, FLORES+
- [Erstellen einer Methode](/docs/eval/methods) — Die Methoden-Schnittstelle und Spezifikation der Method Card
- [Methoden-Leaderboard](/leaderboard) — Live-Benchmark-Bewertungen