---
sidebar_position: 9
title: 'Agent Guide: Using i18n-rosetta'
description: 'How AI agents can install, configure, and run i18n-rosetta to translate locale files.'
---

# Agent Guide: Using i18n-rosetta

i18n-rosetta is a CLI tool that translates your app's locale files with one command. This guide is for AI agents (or developers working with AI agents) who want to go from zero to translated locale files quickly.

:::tip Already familiar?
If you just need commands, jump to the [CLI Reference](/docs/reference/cli). If you want to build and benchmark a translation method, see the [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Install and First Sync

```bash
# No install needed — npx runs it directly
npx i18n-rosetta sync
```

Rosetta auto-detects your locale files, their format (JSON, TOML, YAML, PO), and your target languages. It translates missing keys, skips what's already done, and writes the results.

**Requirements:**
- Node.js 18+
- An API key for your translation provider (set via `OPENROUTER_API_KEY` or `GOOGLE_TRANSLATE_API_KEY`)

---

## Configuration

Create `i18n-rosetta.config.json` in your project root:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Key fields:

| Field | Purpose |
|-------|---------|
| `inputLocale` | Source language (default: `en`) |
| `pairs` | Map of source→target with method config |
| `localesDir` | Where locale files live (auto-detected if omitted) |
| `model` | LLM model for `llm`/`llm-coached` methods (default: `google/gemini-2.5-flash`) |

Full reference: [Configuration](/docs/getting-started/configuration)

---

## Translation Methods

| Method | When to use | Cost |
|--------|------------|------|
| **`llm`** | General-purpose, good for well-resourced languages | Per-token (model-dependent) |
| **`llm-coached`** | When you have grammar rules/dictionary for the target language | Per-token + coaching context |
| **`google-translate`** | High-resource languages where GT works well | $20/million chars |
| **`api`** | Custom pipeline hosted behind an HTTP endpoint | Server-determined |
| **`plugin`** | Pre-packaged method installed locally | Varies |

Details: [Translation Methods](/docs/guides/translation-methods)

---

## Coaching Data

For `llm-coached` pairs, coaching data steers the LLM with explicit linguistic knowledge. Create a coaching file:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Reference it in your pair config:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

The harness verifies that dictionary terms actually appear in the output — violations are logged as `[TERM]` warnings.

Details: [Coaching Data](/docs/concepts/coaching-data)

---

## Quality Gate

Every translation passes through five automated checks before it's written to disk:

| Check | What it catches |
|-------|----------------|
| **Empty/blank** | Model returned nothing |
| **Source echo** | Model returned the English input unchanged |
| **Hallucination loop** | Repeated trigrams (`"Qo' Qo' Qo' Qo'"`) |
| **Length inflation** | Output is 4×+ longer than source |
| **Script compliance** | Wrong script for the locale (Latin for Arabic, etc.) |

Failures are logged with `[GATE]` prefix. No silent fallbacks — if a translation fails, it's reported, not quietly accepted.

Details: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Rosetta caches translations in `.rosetta/tm.json`, keyed by source text + locale + method. On subsequent syncs, unchanged keys are served from cache — no API call, no cost.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

To bypass the cache for one run: `npx i18n-rosetta sync --no-tm`

Details: [Translation Memory](/docs/concepts/translation-memory)

---

## Common Patterns

**Translate one language:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Translate 30 languages at once:**
```bash
# Configure all pairs in config, then:
npx i18n-rosetta sync
```
Rosetta processes pairs sequentially. With TM caching, only changed keys are translated.

**Content mode (Markdown/MDX):**
```bash
npx i18n-rosetta sync --content
```
Translates docs, blog posts, and content files alongside locale JSON.

**Dry run (preview without writing):**
```bash
npx i18n-rosetta sync --dry-run
```

**Check translation status:**
```bash
npx i18n-rosetta status
```
Shows coverage, quality tiers, and plugin info for each pair.

---

## What's Next

- [Quick Start](/docs/getting-started/quick-start) — full getting-started walkthrough
- [CLI Reference](/docs/reference/cli) — every command and flag
- [The Eval Harness Bridge](/docs/guides/bridge) — how rosetta connects to the Arena
- **Want to build your own translation method?** See the [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide) — build a method, prove it works, win prizes.
