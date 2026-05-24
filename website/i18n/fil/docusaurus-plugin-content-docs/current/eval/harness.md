---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

Ang harness ay nagra-run ng mga translation experiment at nagpo-produce ng mga run card. Ito na po ang bahala sa prompt construction, API calls, scoring, at result serialization — i-supply niyo lang ang dataset at ang model.

## Installation

**Requirements:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

I-clone ang harness repository:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Usage

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Ira-run po nito ang bawat entry sa dataset gamit ang naka-configure na model, iskoran ang mga output, at magsusulat ng run card JSON file sa `results/` directory.

## CLI Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Path papunta sa evaluation dataset JSON file |
| `--model` | — | `openai/gpt-4o` | OpenRouter model slug (hal., `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Experiment label. Gamitin para ma-distinguish ang mga prompt strategy (hal., `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Sampling temperature. Mas mababa = mas deterministic |
| `--batch-size` | — | `5` | Bilang ng mga entry per concurrent API batch |
| `--fst-analyzer` | — | `null` | Path papunta sa isang FST analyzer binary. Kapag na-provide, ite-test ang bawat output para sa morphological acceptance |
| `--submit` | — | `false` | I-submit ang run card sa leaderboard API pagkatapos ma-kumpleto ang run |

### Mga Example

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

## Run Card Schema

Bawat experiment ay nagpo-produce ng isang **run card** — isang self-contained JSON document. Ang top-level structure nito ay:

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

Tingnan po ang [Run Card Specification](/docs/eval/run-card) para sa buong schema kung saan naka-document ang bawat field.

### Key Blocks

**`dataset`** — Nag-i-identify kung aling dataset ang ginamit, kasama ang content hash nito para naka-tie ang mga result sa isang specific na version:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Mga aggregate metric para sa run:

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

**`totals`** — Token usage at cost tracking:

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

## Fingerprint vs Run Card Hash

Nagpo-produce ang harness ng dalawang magkaibang hash. Mayroon silang magkaibang purpose:

### Fingerprint

Sinasagot ng **fingerprint** ang: *"Puwede bang ma-reproduce ang run na ito?"*

Hina-hash nito ang combination ng mga input na nagde-define sa experiment configuration — hindi ang mga output:

- Dataset SHA-256
- Model slug
- Condition label
- System prompt SHA-256
- Temperature
- Harness version

Ang dalawang run na may identical na fingerprint ay gumamit ng parehong setup. Dapat comparable ang kanilang mga result (modulo API non-determinism).

### Run Card Hash

Sinasagot ng **run card hash** ang: *"Na-tamper ba ang specific result file na ito?"*

Ito ang SHA-256 ng buong run card JSON (hindi kasama ang mismong `run_card_hash` field). Kung may magbago man sa kahit anong field — isang score, isang timestamp, o isang output — mabe-break ang hash.

:::info Kailan gagamitin ang alin
Gamitin po ang **fingerprint** para i-group ang mga comparable run (parehong experiment, magkaibang execution). Gamitin ang **run card hash** para i-verify ang integrity ng isang specific na result file.
:::

---

## Pag-submit sa Leaderboard

### Automatic submission

I-pass ang `--submit` para ma-upload ang run card pagka-kumpleto:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Manual submission

Naka-save ang mga run card bilang JSON files sa `results/`. Puwede niyo pong i-submit ang kahit anong run card file via leaderboard UI sa [/leaderboard](/leaderboard), o kaya through the API:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Leaderboard validation
Bini-validate ng leaderboard ang mga sinubmit na run card laban sa dataset registry. Ang mga submission na nagre-reference ng unknown datasets, o may sirang `run_card_hash`, ay ire-reject.
:::

:::danger HUWAG MAG-TRAIN sa evaluation data
Kung nakita na ng method niyo ang evaluation dataset during development — bilang training data, few-shot examples, dictionary entries, o prompt engineering material — madi-**disqualify** po ang submission ninyo. Tingnan ang [MT Evaluation](/docs/eval/) para malaman kung ano ang good vs. bad method.
:::

---

## Tingnan Din

- [MT Evaluation](/docs/eval/) — overview, leaderboard value proposition, at good/bad method guidance
- [Evaluation Datasets](/docs/eval/datasets) — dataset format, EDTeKLA, FLORES+
- [Run Card Specification](/docs/eval/run-card) — ang buong JSON schema
- [Building a Method](/docs/eval/methods) — ang method interface para sa paggawa ng mga evaluable method
- [Method Leaderboard](/leaderboard) — mga live benchmark score