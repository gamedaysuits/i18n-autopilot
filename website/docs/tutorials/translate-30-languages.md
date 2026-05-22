---
sidebar_position: 2
title: "Translate 30 Languages"
description: "Cookbook: scale a project from 3 languages to 30 using per-pair method mixing, batching, and CI integration."
---

# Cookbook: Translate 30 Languages

Scale a project from a handful of locales to global coverage. This cookbook walks through method selection, cost optimization, and CI integration for a real multi-language deployment.

**Scenario:** You have a SaaS app with `en`, `fr`, `es`. You need to add 27 more languages across three tiers of quality requirements.

---

## Step 1: Categorize Your Languages

Not all 30 languages need the same approach. Group them by available method quality:

| Tier | Languages | Method | Why |
|------|-----------|--------|-----|
| **Tier 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | High-value markets, nuanced grammar |
| **Tier 2 — Standard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | High-volume, well-supported by Google |
| **Tier 3 — Coached** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Low-resource, require terminology enforcement |

## Step 2: Configure Per-Pair

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "openai/gpt-4o-mini",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**Note:** Languages not listed in `pairs` inherit `defaultMethod: "google-translate"`. You don't need to list all 30.

:::info
`crk` support is under development — see [Support a Low-Resource Language](/docs/guides/low-resource-languages) for status and contribution guidelines.
:::

## Step 3: Set Up API Keys

You'll need both API keys for this configuration:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Step 4: Dry Run First

Always preview before translating 30 languages:

```bash
npx i18n-rosetta sync --dry
```

Review the output. It will show:
- Which pairs use which method
- How many keys are new/changed per locale
- Estimated API calls per tier

## Step 5: Run the Sync

```bash
npx i18n-rosetta sync
```

Rosetta processes each pair independently. The Tier 2 pairs using Google Translate will be fast. Tier 1 LLM pairs will be slower but higher quality. Tier 3 coached pairs use the plugin's coaching data.

### Incremental Updates

After the initial sync, subsequent runs only translate **changed or new** keys:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

The lock file (`.i18n-rosetta.lock`) tracks what's been translated, so you never retranslate stable content.

## Step 6: Audit Quality

Check the status of all language pairs:

```bash
npx i18n-rosetta status
```

This outputs a table showing each pair's method, model, quality tier, and whether coaching data or benchmark scores are available.

## Step 7: CI Integration

Add to your GitHub Actions workflow so translations stay current on every push:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## Cost Estimation

For a project with 500 source keys across 30 languages:

| Tier | Languages | Method | Approximate Cost |
|------|-----------|--------|-----------------|
| Tier 1 (5 langs) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/full sync |
| Tier 2 (18 langs) | it, nl, pl, etc. | Google Translate | ~$0.90/full sync |
| Tier 3 (4 langs) | crk, oj, mi, haw | GPT-4o-mini coached | ~$0.40/full sync |
| **Total** | **30 languages** | **Mixed** | **~$3.80/full sync** |

Incremental syncs (5–20 changed keys) cost a fraction of a full sync.

## See Also

- [Translation Methods](/docs/guides/translation-methods) — How each translation method works and when to use it
- [Plugin Specification](/docs/reference/plugin-spec) — Create coaching data for any of your Tier 3 languages
- [CI/CD Guide](/docs/guides/ci-cd) — Advanced CI patterns including PR preview builds
- [Quality Gate](/docs/concepts/quality-gate) — How Rosetta validates every translation before writing it
- [Supported Languages](/docs/reference/supported-languages) — Full list of language codes and method compatibility
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — Add coaching data for languages without broad MT coverage
