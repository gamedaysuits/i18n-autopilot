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

## Environment Setup

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Requirements:**
- Node.js 18+
- An API key for your translation provider

**API key setup** — rosetta needs at least one key depending on which methods you use:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta reads `.env` automatically. Get an OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys).

---

## First Sync

Rosetta auto-detects your locale files, their format (JSON, TOML, YAML, PO), and your target languages:

```bash
npx i18n-rosetta sync
```

**What happens:**
1. Loads `i18n-rosetta.config.json` (or auto-detects settings)
2. Scans your source locale file, flattens nested keys
3. Compares against `.i18n-rosetta.lock` (SHA-256 hashes of previously translated values)
4. Checks `.rosetta/tm.json` for cached translations (Translation Memory)
5. Translates only **changed, missing, or stale keys** via the configured method
6. Runs the quality gate (5 checks) on every translation
7. Writes passing translations to the target locale file
8. Updates the lock file and TM cache

On a typical re-run after changing one key, step 4 serves 142 keys from cache and step 5 translates 1 key. This is why subsequent syncs are fast and cheap.

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

| Field | Purpose | Default |
|-------|---------|---------|
| `inputLocale` | Source language | `en` |
| `pairs` | Map of source→target with method config | (required) |
| `localesDir` | Where locale files live | (auto-detected) |
| `model` | LLM model for `llm`/`llm-coached` methods | `google/gemini-2.5-flash` |
| `batchSize` | Keys per API call | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Parallel locale translations for JSON keys | 50 |
| `contentConcurrency` | Parallel API calls for content translation | 48 |

Full reference: [Configuration](/docs/getting-started/configuration)

---

## Translation Methods

| Method | When to use | Cost | API key needed |
|--------|------------|------|---------------|
| **`llm`** | General-purpose, good for well-resourced languages | Per-token (model-dependent) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | When you have grammar rules/dictionary for the target language | Per-token + coaching context | `OPENROUTER_API_KEY` |
| **`google-translate`** | High-resource languages where GT works well | $20/million chars | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Custom pipeline hosted behind an HTTP endpoint | Server-determined | None (endpoint handles auth) |
| **`plugin`** | Pre-packaged method installed locally | Varies | Varies |

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

The quality gate verifies that dictionary terms actually appear in the output — violations are logged as `[TERM]` warnings.

Details: [Coaching Data](/docs/concepts/coaching-data)

---

## Quality Gate

Every translation passes through five automated checks before it's written to disk:

| Check | What it catches | Example |
|-------|----------------|---------|
| **Empty/blank** | Model returned nothing | `""` |
| **Source echo** | Model returned the English input unchanged | `"Welcome"` for Japanese |
| **Hallucination loop** | Repeated trigrams | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | Output is 4×+ longer than source | 10-char source → 50-char output |
| **Script compliance** | Wrong script for the locale | Latin text for Arabic locale |

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

## Generated Files

Rosetta creates several files in your project. Know what they are so you don't accidentally delete or commit the wrong ones:

| File | Purpose | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | SHA-256 hashes of translated source values (change detection) | **Yes** — commit this |
| `.i18n-rosetta-content.lock` | Same, but for Markdown/MDX content files | **Yes** — commit this |
| `.rosetta/tm.json` | Translation Memory cache | **Yes** — commit this (saves API costs for the team) |
| `.rosetta/coaching/` | Coaching data directory | **Yes** — this is your linguistic knowledge |
| `i18n-rosetta.config.json` | Project configuration | **Yes** — commit this |

---

## Common Patterns

**Translate one language pair:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Translate all configured pairs:**
```bash
npx i18n-rosetta sync
```
Rosetta translates all locales in parallel. With TM caching, only changed keys hit the API.

**Content mode (Markdown/MDX for Docusaurus, Hugo, etc.):**
```bash
npx i18n-rosetta sync --content
```
Translates docs, blog posts, and content files alongside locale JSON. Uses parallel concurrency (default: 48 simultaneous API calls). Tune with `--content-concurrency`.

**Dry run (preview without writing):**
```bash
npx i18n-rosetta sync --dry-run
```

**Force re-translate specific keys:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Force re-translate all content files:**
```bash
npx i18n-rosetta sync --force-content
```

**Check translation status:**
```bash
npx i18n-rosetta status
```
Shows coverage, quality tiers, and plugin info for each pair.

**Audit for untranslated fallbacks:**
```bash
npx i18n-rosetta audit
```
Lists all `[EN]` fallback values that need translation.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Export the key or add it to `.env` in your project root |
| `No locale files found` | Set `localesDir` in config, or ensure your locale files match standard naming (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Your target locale got Latin text instead of the expected script — try a different model or add coaching data |
| `[GATE] Source echo` | The model returned English unchanged — coaching data or a different model usually fixes this |
| All translations cached | Run with `--no-tm` to bypass the cache, or `--force-keys` for specific keys |
| Lock file conflicts | `.i18n-rosetta.lock` uses SHA-256 hashes — merge conflicts are safe to resolve by keeping either version, then re-running sync |

---

## What's Next

- [Quick Start](/docs/getting-started/quick-start) — full getting-started walkthrough
- [CLI Reference](/docs/reference/cli) — every command and flag
- [How It Works](/docs/how-it-works) — the sync pipeline explained
- [The Eval Harness Bridge](/docs/guides/bridge) — how rosetta connects to the Arena
- **Want to build your own translation method?** See the [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide) — build a method, prove it works, win prizes.
