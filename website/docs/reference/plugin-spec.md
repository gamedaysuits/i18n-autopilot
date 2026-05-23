---
sidebar_position: 2
title: Plugin Specification
---

# Method Plugin Specification

> **Version**: 1.1  
> **Audience**: Plugin developers  
> **Canonical Schema**: [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

## Overview

i18n-rosetta uses a **pluggable method system**. Each language pair can use a different translation method (LLM, coached, script-converter, etc.). Methods are registered in `lib/translate.js` and resolved per-pair via `lib/pairs.js`.

The eval harness's job is to **develop, test, and export** translation methods. i18n-rosetta's job is to **consume and execute** them. The harness never runs inside rosetta.

### Data Flow

```mermaid
flowchart LR
    A["Evaluation Harness\n(Python / standalone)"] -->|"method.json\n+ coaching data"| B["i18n-rosetta\n(Node.js / npm)"]
```

---

## Method Plugin Format

A method plugin is a single JSON file (`method.json`) with optional coaching data files.

### `method.json` — Required

```json
{
  "name": "french-formal-v1",
  "type": "llm-coached",
  "version": "1.0.0",
  "description": "Formally-tuned French with terminology enforcement and grammar coaching",
  "author": "Plugin Author",

  "config": {
    "model": "google/gemini-3.5-flash",
    "register": "formal",
    "batchSize": 30,
    "temperature": 0.2
  },

  "locales": ["fr"],

  "benchmarks": {
    "fr": {
      "date": "2026-05-11T00:00:00Z",
      "corpus_size": 500,
      "exact_match_rate": 0.42,
      "corpus_chrf": 72.3,
      "corpus_bleu": 45.1,
      "model": "google/gemini-3.5-flash",
      "harness_version": "1.0.0"
    }
  },

  "provenance": {
    "resources": [],
    "commercialReady": false,
    "flags": ["license-unclear"]
  },

  "coaching": {
    "dir": "coaching"
  }
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique method identifier (kebab-case) |
| `type` | string | ✅ | Rosetta method type: `llm`, `llm-coached`, `api`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini` |
| `version` | string | ✅ | Semver version (e.g. `1.0.0`) |
| `locales` | string[] | ✅ | Which locale codes this method targets (minimum 1) |
| `description` | string | — | Human-readable description |
| `author` | string | — | Who developed/tested this method |
| `config.model` | string | — | OpenRouter model identifier |
| `config.register` | string | — | Target language register/tone |
| `config.batchSize` | number | — | Keys per API batch (1–200, default: 30) |
| `config.temperature` | number | — | LLM temperature (0.0–2.0, default: 0.3) |
| `benchmarks` | object | — | Per-locale benchmark results |
| `provenance` | object | — | Licensing and resource dependencies |
| `coaching.dir` | string | — | Relative path to coaching data directory |

### Benchmark Object (per locale)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | ✅ | ISO 8601 timestamp of the benchmark run |
| `corpus_size` | number | ✅ | Number of entries evaluated |
| `exact_match_rate` | number | ✅ | 0.0–1.0, proportion of exact matches |
| `corpus_chrf` | number | — | chrF++ score (0–100) |
| `corpus_bleu` | number | — | BLEU score (0–100) |
| `model` | string | ✅ | Model used during eval |
| `harness_version` | string | ✅ | Version of the evaluation harness used |

:::info Which metrics are displayed?
The `rosetta status` command displays **chrF++** and **exact match rate** from the benchmark block. `corpus_bleu` is accepted in the manifest but is not currently displayed or used by any rosetta command. The [Method Leaderboard](/leaderboard) tracks chrF++, exact match, and FST acceptance rate.
:::

---

### Provenance Object

The provenance block communicates the licensing status of the plugin's bundled resources.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `resources` | object[] | `[]` | List of bundled resources with `name`, `license`, and `type` |
| `commercialReady` | boolean | `false` | Whether the plugin is cleared for commercial distribution |
| `flags` | string[] | `["license-unclear"]` | Machine-readable status flags |

**Default state** — exported plugins ship with `commercialReady: false` and `flags: ["license-unclear"]`.

**Cleared state** — when licensing has been verified: set `commercialReady: true` and clear the flags.

---

## Coaching Data Format

If `type` is `llm-coached`, the plugin should include coaching data files in the `coaching/` subdirectory.

### `coaching/<locale>.json`

```json
{
  "grammar_rules": [
    "French adjectives agree in gender and number with the noun they modify",
    "Use 'vous' for formal contexts, 'tu' for informal"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "deployment": "déploiement",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms where a native French term exists."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `grammar_rules` | string[] | — | Rules injected into every LLM prompt for this locale |
| `dictionary` | object | — | Term → translation map. Matched terms are injected as required terminology. |
| `style_notes` | string | — | Freeform style instructions appended to the prompt |

---

## Directory Structure

```
french-formal-v1/
  method.json                 # Method manifest with benchmarks
  coaching/
    fr.json                   # Coaching data for French
```

For multi-locale methods:

```
european-formal-v2/
  method.json                 # locales: ["fr", "de", "es", "it"]
  coaching/
    fr.json
    de.json
    es.json
    it.json
```

---

## How Rosetta Consumes Plugins

### Installation

```bash
i18n-rosetta plugin install ./french-formal-v1/
```

Saves to `.rosetta/methods/french-formal-v1/`.

### Configuration

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": {
      "methodPlugin": "french-formal-v1"
    }
  }
}
```

:::info Merge semantics
The plugin defines *what* method to use (`type`). The pair config tunes *how* to run it (`model`, `register`, `batchSize`). If the pair sets `model`, it overrides the plugin's default.
:::

### Runtime

1. Rosetta reads `method.json` from `.rosetta/methods/french-formal-v1/`
2. The plugin's `type` field sets the translation method (e.g., `llm-coached`)
3. Loads coaching data from the plugin's `coaching/` directory
4. Uses the `config` block to fill gaps in model/register/temperature
5. The `benchmarks` block is displayed in `rosetta status` output
6. The `provenance` block is checked by `rosetta provenance` for licensing flags

---

## Schema Validation

Plugin manifests are validated at install time against [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json).

Reference the schema in your `method.json` for IDE autocompletion:

```json
{
  "$schema": "./node_modules/i18n-rosetta/schemas/rosetta-plugin.schema.json",
  "name": "my-method-v1"
}
```

---

## What NOT to Include

- ❌ No Python code or harness dependencies
- ❌ No raw corpus data or run logs
- ❌ No API keys or credentials
- ❌ No harness configuration
- ❌ No internal prompt templates (those live in rosetta's method implementations)

The plugin is **data only**: configuration, coaching content, and benchmark results.

---

## See Also

- [Translation Methods](/docs/guides/translation-methods) — how each built-in method works
- [Configuration](/docs/getting-started/configuration) — per-pair and per-language config
- [Serving a Method via API](/docs/guides/serving-a-method) — hosting methods as HTTP services
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — building and packaging a pipeline
- [MT Evaluation](/docs/eval/) — benchmarking methods for leaderboard submission
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — the use case for community plugins
