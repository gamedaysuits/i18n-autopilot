# Agent Guide

> **Executive Summary.** This document is a structured index for AI agents navigating the i18n-rosetta / MT Eval Arena ecosystem. It maps the repository, explains the project in one pass, and provides decision paths for common tasks. If you're an agent and you're reading this first, you're in the right place.

---

## What This Project Is (One Paragraph)

An open platform for competitive machine translation. Anyone builds a translation method (coached LLM, FST pipeline, fine-tuned model, hybrid — anything), benchmarks it against standardized evaluation corpora using the eval harness, and submits scores to a public leaderboard. For Indigenous and low-resource languages, proven methods transfer ownership to the language community and deploy to production via the i18n-rosetta API. Revenue from API usage flows back to the community. The full explanation is in [HOW_IT_WORKS.md](HOW_IT_WORKS.md).

---

## Repository Map

This is a monorepo. The three main components:

```
i18n-autopilot/                          ← You are here
├── docs/
│   ├── HOW_IT_WORKS.md                  ← START HERE: the solution explainer
│   ├── BENCHMARK_SPEC.md                ← Evaluation protocol, corpus schema, run card format
│   ├── SCORING_SPEC.md                  ← SSOT: metrics, composite weights, quality tiers
│   └── AGENTS.md                        ← This file
│
├── src/                                 ← i18n-rosetta CLI source (Node.js)
│   ├── core/                            ← Sync engine, change detection, file I/O
│   ├── methods/                         ← Translation method implementations (10 methods)
│   ├── quality/                         ← Quality gates (hallucination, script, echo checks)
│   └── cli/                             ← CLI command handlers
│
├── gds-mt-eval-harness/                 ← MT Eval Arena (Python)
│   ├── mt_eval_harness/                 ← Harness source
│   │   ├── config.py                    ← Default configuration (canonical field names)
│   │   ├── scoring.py                   ← Code mirror of SCORING_SPEC (weights, tiers, formulas)
│   │   ├── publish.py                   ← Run card assembly (imports from scoring.py)
│   │   ├── tester.py                    ← Metric computation (chrF++, exact match, FST)
│   │   └── runner.py                    ← Main evaluation loop
│   ├── eval/                            ← Experiment scripts
│   ├── website/                         ← Arena Docusaurus site (mtevalarena.org)
│   │   └── docs/
│   │       ├── intro.md                 ← Arena landing page
│   │       ├── specifications/          ← Harness, methods, run-card specs
│   │       ├── leaderboard/             ← Datasets, rules
│   │       ├── sovereignty/             ← Economic model, ownership transfer, data sovereignty
│   │       ├── community/               ← For language communities, low-resource language guide
│   │       └── tutorials/               ← FST-gated pipeline cookbook
│   └── data/                            ← Evaluation datasets (EDTeKLA, FLORES+)
│
└── crk-translate/                       ← Plains Cree translation research
    ├── docs/research/                   ← Experimental results
    └── coaching/                        ← Coaching data (grammar rules, dictionaries)
```

---

## Key Documents (Read These First)

Read in this order for fastest comprehension:

| Priority | Document | What It Tells You |
|----------|----------|-------------------|
| 1 | [HOW_IT_WORKS.md](HOW_IT_WORKS.md) | Why this exists, the full solution loop, who it serves |
| 2 | [SCORING_SPEC.md](SCORING_SPEC.md) | **SSOT**: All metric definitions, composite weights, quality tiers, cost/speed formulas |
| 3 | [BENCHMARK_SPEC.md](BENCHMARK_SPEC.md) | Evaluation protocol, corpus schema, run card format, sovereignty mechanisms |
| 4 | [Arena intro](../gds-mt-eval-harness/website/docs/intro.md) | Arena landing page — how to submit, current benchmarks |
| 5 | [Methods spec](../gds-mt-eval-harness/website/docs/specifications/methods.md) | The `TranslationProcess` protocol, method classes, plugin format |
| 6 | [Datasets](../gds-mt-eval-harness/website/docs/leaderboard/datasets.md) | Available evaluation corpora, entry schema, difficulty tiers |
| 7 | [Harness docs](../gds-mt-eval-harness/website/docs/specifications/harness.md) | How to install and run the eval harness |

---

## Decision Tree: What Do You Want To Do?

### "I want to build a translation method and submit to the leaderboard"

1. Read [BENCHMARK_SPEC.md](BENCHMARK_SPEC.md) §3 (run card schema) and [SCORING_SPEC.md](SCORING_SPEC.md) §2 (metrics)
2. Read [Methods spec](../gds-mt-eval-harness/website/docs/specifications/methods.md) for the `TranslationProcess` protocol
3. Clone the [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Look at `eval/baseline_experiment.py` for a working example
5. Run against a dataset in `data/`
6. Your output is a run card JSON — submit it via PR

### "I want to understand the evaluation metrics"

Read [SCORING_SPEC.md](SCORING_SPEC.md) §2. Key points:
- **chrF++** (0–100): Character n-gram F-score. Best surface metric for morphologically rich languages.
- **FST acceptance** (0.0–1.0): Morphological validity gate. If the FST rejects a word, it's not a valid word form.
- **Exact match** (0.0–1.0): Strict match after normalization.
- **Equivalent match** (0.0–1.0): Accepts word order and dialectal variants. Available for CRK today; will generalize.
- **Semantic score** (0.0–1.0): Meaning preservation regardless of surface form. Available for CRK today; will generalize.
- **Composite**: Weighted average of available metrics. Weights differ by FST availability. See SCORING_SPEC §4.

### "I want to add a new language"

Read [BENCHMARK_SPEC.md](BENCHMARK_SPEC.md) §11. Minimum: 50 gold-standard entries, 30 development entries, community consent. Check [low-resource-languages.md](../gds-mt-eval-harness/website/docs/community/low-resource-languages.md) for the full guide and available FST registries (GiellaLT, Apertium, UniMorph).

### "I want to understand the sovereignty model"

Read [BENCHMARK_SPEC.md](BENCHMARK_SPEC.md) §8 and the Arena docs:
- [Data Sovereignty](../gds-mt-eval-harness/website/docs/sovereignty/data-sovereignty.md) — OCAP®, CARE, Te Mana Raraunga
- [Ownership Transfer](../gds-mt-eval-harness/website/docs/sovereignty/ownership-transfer.md) — what triggers transfer, what each party retains
- [Economic Model](../gds-mt-eval-harness/website/docs/sovereignty/economic-model.md) — the revenue flywheel

### "I want to use rosetta to translate my app"

You don't need the Arena docs at all. Read:
- The [root README](../README.md) — quick start, methods, configuration
- Run `npx i18n-rosetta sync` with an API key

---

## Key Concepts (Glossary)

| Term | Definition |
|------|-----------|
| **Method** | A complete translation recipe: model + prompt + tools + pre/post-processing. Not just a model. |
| **Run card** | JSON document recording the complete configuration and results of one evaluation run. The atomic unit of benchmarking. |
| **Fingerprint** | SHA-256 hash of the experiment configuration. Two runs with the same fingerprint used the same setup. |
| **Composite score** | Weighted average of available metrics (0.0–1.0). Weights differ by FST availability. See SCORING_SPEC §4 for weight tables. |
| **FST** | Finite-state transducer. A morphological analyzer that deterministically validates whether a word is a valid form in the target language. |
| **Corpus segment** | `development` (public, iterate freely), `diagnostic` (targeted linguistic phenomena), `gold_standard` (secret, governance-controlled). |
| **Quality tier** | Heuristic label on composite score: Baseline (0–0.30), Emerging (0.30–0.50), Functional (0.50–0.70), Deployable (0.70–0.85), Fluent (0.85–1.0). |
| **Verification tier** | Who validated the result: Self-benchmarked, GDS Verified, Community Validated. |
| **Coaching data** | Grammar rules, dictionary entries, and style notes injected into LLM prompts to improve translation quality. |
| **Plugin** | A method packaged for deployment via i18n-rosetta. JSON manifest + method code. |

---

## Canonical Field Names

The eval harness and all documentation use these field names. If you encounter old names in any file, the spec names are authoritative:

| Canonical (Spec) | Old / Alias | Where Used |
|-------------------|-------------|------------|
| `source` | `source_text` | Corpus entries, run card results |
| `reference` | `target_expected` | Corpus entries, run card results |
| `predicted` | `target_output` | Run card results |
| `id` | `index`, `entry_index` | Corpus entries, run card results |
| `difficulty` (integer 1–5) | `difficulty` (string "easy"/"medium"/"hard") | Corpus entries |

---

## How to Build a Method (Step by Step)

```
1. Pick a language pair       → Check available datasets in data/
2. Choose your approach       → See Methods spec for the TranslationProcess protocol
3. Implement translate()      → async def translate(entries, config) -> results
4. Run the harness            → python eval/baseline_experiment.py --dataset ... --condition ...
5. Read your run card         → JSON file in results/ with all metrics
6. Iterate                    → Change your prompt, coaching data, tools, retry strategy
7. Submit                     → PR your run card to the harness repo, or use --submit flag
```

The harness doesn't care how your method works internally. It sends entries (source text + metadata), you return predictions. That's the interface.

---

*For internal development guidance (repo conventions, current priorities, cross-component dependencies), see the internal agent guide in the project vault.*
