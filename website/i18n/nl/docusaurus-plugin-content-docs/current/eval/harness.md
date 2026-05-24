---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

Het harness voert vertaalexperimenten uit en produceert run cards. Het beheert de promptconstructie, API-aanroepen, scoring en de serialisatie van resultaten — u levert de dataset en het model.

## Installatie

**Vereisten:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

Kloon de harness-repository:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Gebruik

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Hiermee wordt elke invoer in de dataset door het geconfigureerde model verwerkt, wordt de uitvoer gescoord en wordt er een run card JSON-bestand naar de map `results/` geschreven.

## CLI-vlaggen

| Vlag | Vereist | Standaard | Beschrijving |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Pad naar het JSON-bestand van de evaluatiedataset |
| `--model` | — | `openai/gpt-4o` | OpenRouter model slug (bijv. `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Experimentlabel. Gebruik dit om promptstrategieën te onderscheiden (bijv. `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Samplingtemperatuur. Lager = meer deterministisch |
| `--batch-size` | — | `5` | Aantal invoeren per gelijktijdige API-batch |
| `--fst-analyzer` | — | `null` | Pad naar een FST analyzer binary. Indien opgegeven, wordt elke uitvoer getest op morfologische acceptatie |
| `--submit` | — | `false` | Dien de run card in bij de leaderboard-API nadat de run is voltooid |

### Voorbeelden

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

## Run Card-schema

Elk experiment produceert een **run card** — een op zichzelf staand JSON-document. De structuur op het hoogste niveau:

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

Zie de [Run Card-specificatie](/docs/eval/run-card) voor het volledige schema waarin elk veld is gedocumenteerd.

### Belangrijkste blokken

**`dataset`** — Identificeert welke dataset is gebruikt, inclusief de content hash, zodat resultaten gekoppeld zijn aan een specifieke versie:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Geaggregeerde statistieken voor de run:

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

**`totals`** — Tokengebruik en kostenregistratie:

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

## Fingerprint versus Run Card Hash

Het harness produceert twee verschillende hashes. Deze dienen verschillende doelen:

### Fingerprint

De **fingerprint** beantwoordt de vraag: *"Kan deze run worden gereproduceerd?"*

Het hasht de combinatie van invoeren die de experimentconfiguratie definiëren — niet de uitvoer:

- Dataset SHA-256
- Model slug
- Conditielabel
- Systeemprompt SHA-256
- Temperatuur
- Harness-versie

Twee runs met identieke fingerprints hebben dezelfde opzet gebruikt. Hun resultaten zouden vergelijkbaar moeten zijn (behoudens API-nondeterminisme).

### Run Card Hash

De **run card hash** beantwoordt de vraag: *"Is er met dit specifieke resultaatbestand geknoeid?"*

Het is de SHA-256 van de volledige run card JSON (exclusief het veld `run_card_hash` zelf). Als er een veld verandert — een score, een tijdstempel, een enkele uitvoer — wordt de hash ongeldig.

:::info Wanneer gebruikt u welke
Gebruik de **fingerprint** om vergelijkbare runs te groeperen (hetzelfde experiment, verschillende uitvoeringen). Gebruik de **run card hash** om de integriteit van een specifiek resultaatbestand te verifiëren.
:::

---

## Indienen bij het Leaderboard

### Automatische indiening

Geef `--submit` mee om de run card na voltooiing te uploaden:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Handmatige indiening

Run cards worden opgeslagen als JSON-bestanden in `results/`. U kunt elk run card-bestand indienen via de leaderboard-UI op [/leaderboard](/leaderboard), of via de API:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Leaderboard-validatie
Het leaderboard valideert ingediende run cards aan de hand van het datasetregister. Inzendingen die verwijzen naar onbekende datasets, of met een ongeldige `run_card_hash`, worden afgewezen.
:::

:::danger TRAIN NIET op evaluatiedata
Als uw methode de evaluatiedataset tijdens de ontwikkeling heeft gezien — als trainingsdata, few-shot voorbeelden, woordenboekvermeldingen of prompt engineering-materiaal — wordt uw inzending **gediskwalificeerd**. Zie [MT-evaluatie](/docs/eval/) voor wat een goede versus een slechte methode maakt.
:::

---

## Zie ook

- [MT-evaluatie](/docs/eval/) — overzicht, waardepropositie van het leaderboard en richtlijnen voor goede/slechte methoden
- [Evaluatiedatasets](/docs/eval/datasets) — datasetformaat, EDTeKLA, FLORES+
- [Run Card-specificatie](/docs/eval/run-card) — het volledige JSON-schema
- [Een methode bouwen](/docs/eval/methods) — de methode-interface voor het creëren van evalueerbare methoden
- [Method Leaderboard](/leaderboard) — live benchmarkscores