---
sidebar_position: 7
title: For Enterprise
description: "How organizations can standardize translation with leaderboard-proven methods, custom plugins, and one-command deployment."
---

# i18n-rosetta for Enterprise

Your team translates content regularly. You have a stack of locale files, a CI pipeline, and a process that probably involves someone manually running Google Translate, copying results into JSON, and hoping for the best. Or you're paying for a TMS platform where you're locked into one vendor's translation engine.

There's a better way.

## The Pitch

1. **Pick the best method for each language** — not whatever your vendor defaults to
2. **Deploy with one command** — `npx i18n-rosetta sync` translates every locale, every format, every time
3. **Swap methods without changing code** — a config change, not a migration
4. **Own your pipeline** — no vendor lock-in, no monthly dashboards, no accounts

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

French gets DeepL (your team prefers its European fluency). Japanese gets a frontier LLM. German gets Google Translate (fast, cheap, good enough). Korean gets an LLM with a formal register. Plains Cree gets a community-built coached plugin that scored highest on the leaderboard.

**Same command. Same CI pipeline. Different methods per pair. One config file.**

## The Leaderboard → Deploy Workflow

:::tip Coming soon: `rosetta leaderboard` CLI
The workflow described below is the planned integration between the [MT Eval Arena](https://mtevalarena.org) leaderboard and the i18n-rosetta CLI. The infrastructure exists on both sides — the bridge is in development.
:::

The [MT Eval Arena](https://mtevalarena.org) is where translation methods are benchmarked with reproducible, fingerprinted scoring. Every method gets a composite score across multiple metrics (chrF++, exact match, FST acceptance, semantic scoring). The leaderboard tracks every submission.

The planned workflow:

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**You don't build the method. You don't train the model. You pick the winner and deploy it.** If a better method appears on the leaderboard next month, you swap it with one command.

## What's Available Today

The leaderboard-to-CLI bridge is in development. Here's what works right now:

### Built-in methods (no plugins needed)

| Method | Best For | Cost |
|--------|----------|------|
| `llm` (default) | Quality-focused, any language | Per-token via OpenRouter |
| `gemini` | Quality + free tier | Free (limited), then per-token |
| `google-translate` | Speed + volume | $20/M characters |
| `deepl` | European languages | $25/M characters |
| `llm-coached` | Languages with coaching data | Per-token via OpenRouter |
| `api` | Custom/community-hosted methods | Self-hosted |

### Plugin methods (install separately)

Custom plugins can wrap any translation logic — a fine-tuned model, an FST-gated pipeline, a community API, or anything else that produces JSON. See [Build a Plugin](/docs/tutorials/build-a-plugin).

## Enterprise Workflow

### 1. Evaluate your current quality

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Run the eval harness on candidates

The [eval harness](https://mtevalarena.org/docs/specifications/harness) lets you benchmark multiple methods against the same dataset. Run a sweep, compare scores, pick winners:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Configure per-pair winners

Update your config to use the best method per language pair. Different languages have different best methods — that's the point.

### 4. Integrate into CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Three commands. Zero manual translation. The pipeline catches hardcoded strings, translates them with your chosen methods, and fails the build if anything is missing or corrupted.

### 5. Professional review (optional)

For high-stakes content, export to XLIFF for human review:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Machine-translate the bulk. Human-review the critical paths. Pay for human time only where it matters.

## Cost Model

rosetta has **no license fee, no monthly subscription, no per-seat pricing**. It's an open-source CLI tool. You pay only for the translation API calls:

| Volume | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1,000 keys × 5 locales | ~$0.50 | ~$0.30 (free tier) | ~$2.00 |
| 10,000 keys × 15 locales | ~$15 | ~$8 | ~$60 |
| 50,000 keys × 30 locales | ~$75 | ~$40 | ~$300 |

Translation Memory means you only pay for **changed keys** on subsequent syncs. If you update 10 strings out of 10,000, you pay for 10 translations, not 10,000.

## vs. TMS Platforms

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Pricing** | Free (open source) + API costs | $50–$500/month + per-seat |
| **Vendor lock-in** | None — switch providers in config | High — data in their cloud |
| **Method choice** | Any provider, any model, per pair | Whatever they offer |
| **CI/CD** | First-class (`lint → sync → audit`) | Plugin/webhook |
| **Custom methods** | Plugin system, community plugins | Not supported |
| **Quality gate** | Built-in (wrong-script, echo, length) | Varies |
| **Self-hosted** | Yes (LibreTranslate, custom API) | No |

See the [full comparison](/docs/guides/comparison) for details.

## Further Reading

- **[Quick Start](/docs/getting-started/quick-start)** — run your first sync in 60 seconds
- **[Translation Methods](/docs/guides/translation-methods)** — the full method menu with decision tree
- **[CI/CD Integration](/docs/guides/ci-cd)** — automate in your pipeline
- **[Working with Professional Translators](/docs/guides/professional-translators)** — XLIFF export/import
- **[MT Eval Arena](https://mtevalarena.org)** — benchmark and leaderboard
- **[Configuration Reference](/docs/getting-started/configuration)** — every config option
