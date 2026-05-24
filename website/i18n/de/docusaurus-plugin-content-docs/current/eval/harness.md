---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

Das Harness führt Übersetzungsexperimente durch und erstellt Run Cards. Es übernimmt die Prompt-Erstellung, API-Aufrufe, Bewertung (Scoring) und Ergebnis-Serialisierung — Sie stellen den Datensatz und das Modell bereit.

## Installation

**Voraussetzungen:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

Klonen Sie das Harness-Repository:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Verwendung

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Dieser Befehl verarbeitet jeden Eintrag im Datensatz durch das konfigurierte Modell, bewertet die Ausgaben und schreibt eine Run-Card-JSON-Datei in das Verzeichnis `results/`.

## CLI-Flags

| Flag | Erforderlich | Standardwert | Beschreibung |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Pfad zur JSON-Datei des Evaluierungsdatensatzes |
| `--model` | — | `openai/gpt-4o` | OpenRouter-Modell-Slug (z. B. `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Experiment-Label. Wird verwendet, um Prompt-Strategien zu unterscheiden (z. B. `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Sampling-Temperatur. Niedriger = deterministischer |
| `--batch-size` | — | `5` | Anzahl der Einträge pro gleichzeitigem API-Batch |
| `--fst-analyzer` | — | `null` | Pfad zu einem FST-Analysator-Binary. Wenn angegeben, wird jede Ausgabe auf morphologische Akzeptanz geprüft |
| `--submit` | — | `false` | Übermittelt die Run Card nach Abschluss des Durchlaufs an die Leaderboard-API |

### Beispiele

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

## Run-Card-Schema

Jedes Experiment erzeugt eine **Run Card** — ein eigenständiges JSON-Dokument. Die Struktur der obersten Ebene:

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

Das vollständige Schema mit einer Dokumentation aller Felder finden Sie in der [Run-Card-Spezifikation](/docs/eval/run-card).

### Wichtige Blöcke

**`dataset`** — Identifiziert, welcher Datensatz verwendet wurde, einschließlich seines Inhalts-Hashes, sodass die Ergebnisse an eine spezifische Version gebunden sind:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Aggregierte Metriken für den Durchlauf:

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

**`totals`** — Token-Nutzung und Kostenverfolgung:

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

## Fingerabdruck vs. Run-Card-Hash

Das Harness erzeugt zwei unterschiedliche Hashes. Diese dienen verschiedenen Zwecken:

### Fingerabdruck

Der **Fingerabdruck** beantwortet die Frage: *"Könnte dieser Durchlauf reproduziert werden?"*

Er hasht die Kombination der Eingaben, die die Experimentkonfiguration definieren — nicht die Ausgaben:

- Datensatz SHA-256
- Modell-Slug
- Bedingungs-Label
- System-Prompt SHA-256
- Temperatur
- Harness-Version

Zwei Durchläufe mit identischen Fingerabdrücken haben denselben Aufbau verwendet. Ihre Ergebnisse sollten vergleichbar sein (abgesehen vom Nicht-Determinismus der API).

### Run-Card-Hash

Der **Run-Card-Hash** beantwortet die Frage: *"Wurde diese spezifische Ergebnisdatei manipuliert?"*

Es ist der SHA-256-Hash des gesamten Run-Card-JSONs (ausschließlich des Feldes `run_card_hash` selbst). Wenn sich ein beliebiges Feld ändert — eine Bewertung, ein Zeitstempel, eine einzelne Ausgabe —, wird der Hash ungültig.

:::info Wann was zu verwenden ist
Verwenden Sie den **Fingerabdruck**, um vergleichbare Durchläufe zu gruppieren (gleiches Experiment, unterschiedliche Ausführungen). Verwenden Sie den **Run-Card-Hash**, um die Integrität einer spezifischen Ergebnisdatei zu überprüfen.
:::

---

## Einreichen beim Leaderboard

### Automatische Einreichung

Übergeben Sie `--submit`, um die Run Card nach Abschluss hochzuladen:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Manuelle Einreichung

Run Cards werden als JSON-Dateien in `results/` gespeichert. Sie können jede Run-Card-Datei über die Leaderboard-Benutzeroberfläche unter [/leaderboard](/leaderboard) oder über die API einreichen:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Leaderboard-Validierung
Das Leaderboard validiert eingereichte Run Cards gegen die Datensatz-Registrierung. Einreichungen, die auf unbekannte Datensätze verweisen oder einen fehlerhaften `run_card_hash` aufweisen, werden abgelehnt.
:::

:::danger NICHT mit Evaluierungsdaten TRAINIEREN
Wenn Ihre Methode den Evaluierungsdatensatz während der Entwicklung gesehen hat — als Trainingsdaten, Few-Shot-Beispiele, Wörterbucheinträge oder Material für das Prompt-Engineering —, wird Ihre Einreichung **disqualifiziert**. Unter [MT-Evaluierung](/docs/eval/) erfahren Sie, was eine gute von einer schlechten Methode unterscheidet.
:::

---

## Siehe auch

- [MT-Evaluierung](/docs/eval/) — Übersicht, Wertversprechen des Leaderboards und Leitfaden für gute/schlechte Methoden
- [Evaluierungsdatensätze](/docs/eval/datasets) — Datensatzformat, EDTeKLA, FLORES+
- [Run-Card-Spezifikation](/docs/eval/run-card) — das vollständige JSON-Schema
- [Erstellen einer Methode](/docs/eval/methods) — die Methoden-Schnittstelle zur Erstellung evaluierbarer Methoden
- [Methoden-Leaderboard](/leaderboard) — Live-Benchmark-Ergebnisse