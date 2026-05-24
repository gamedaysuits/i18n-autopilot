---
sidebar_position: 2
title: "I-translate ang 30 Languages"
description: "Cookbook: I-scale ang project mula 3 languages hanggang 30 gamit ang per-pair method mixing, batching, at CI integration."
---
# Cookbook: Mag-translate ng 30 Languages

I-scale ang isang project mula sa ilang locales papunta sa global coverage. Ipapaliwanag po ng cookbook na ito ang method selection, cost optimization, at CI integration para sa isang totoong multi-language deployment.

**Scenario:** Mayroon po kayong SaaS app na may `en`, `fr`, `es`. Kailangan niyo pong magdagdag ng 27 pang languages sa tatlong tiers ng quality requirements.

---

## Step 1: I-categorize ang Inyong Languages

Hindi po lahat ng 30 languages ay nangangailangan ng parehong approach. I-group po sila base sa available method quality:

| Tier | Languages | Method | Bakit |
|------|-----------|--------|-----|
| **Tier 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | High-value markets, nuanced ang grammar |
| **Tier 2 — Standard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | High-volume, well-supported ng Google |
| **Tier 3 — Coached** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Low-resource, kailangan ng terminology enforcement |

## Step 2: Mag-configure Per-Pair

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
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

**Note:** Ang mga languages na hindi nakalista sa `pairs` ay mag-i-inherit ng `defaultMethod: "google-translate"`. Hindi niyo po kailangang ilista lahat ng 30.

:::info
Ang `crk` support ay under development pa po — tingnan ang [Support a Low-Resource Language](/docs/guides/low-resource-languages) para sa status at contribution guidelines.
:::

## Step 3: I-set Up ang API Keys

Kakailanganin niyo po ang parehong API keys para sa configuration na ito:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Step 4: Mag-Dry Run Muna

Lagi pong mag-preview bago mag-translate ng 30 languages:

```bash
npx i18n-rosetta sync --dry
```

I-review po ang output. Ipapakita nito ang:
- Kung aling pairs ang gumagamit ng aling method
- Kung ilang keys ang bago/nabago per locale
- Estimated API calls per tier

## Step 5: I-run ang Sync

```bash
npx i18n-rosetta sync
```

Pinoproseso ng Rosetta ang bawat pair nang independently. Magiging mabilis po ang Tier 2 pairs na gumagamit ng Google Translate. Mas mabagal pero higher quality ang Tier 1 LLM pairs. Gagamitin naman ng Tier 3 coached pairs ang coaching data ng plugin.

### Incremental Updates

Pagkatapos ng initial sync, ang mga susunod na runs ay magta-translate lang ng **changed o new** keys:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

Tinatrack ng lock file (`.i18n-rosetta.lock`) kung ano na ang na-translate, kaya hindi niyo na po ire-retranslate ang stable content.

## Step 6: I-audit ang Quality

I-check po ang status ng lahat ng language pairs:

```bash
npx i18n-rosetta status
```

Mag-o-output po ito ng table na nagpapakita ng method, model, at quality tier ng bawat pair, at kung available ba ang coaching data o benchmark scores.

## Step 7: CI Integration

Idagdag po ito sa inyong GitHub Actions workflow para laging current ang translations sa bawat push:

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

Para sa isang project na may 500 source keys across 30 languages:

| Tier | Languages | Method | Approximate Cost |
|------|-----------|--------|-----------------|
| Tier 1 (5 langs) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/full sync |
| Tier 2 (18 langs) | it, nl, pl, etc. | Google Translate | ~$0.90/full sync |
| Tier 3 (4 langs) | crk, oj, mi, haw | GPT-4o-mini coached | ~$0.40/full sync |
| **Total** | **30 languages** | **Mixed** | **~$3.80/full sync** |

Ang incremental syncs (5–20 changed keys) ay nagkakahalaga lang ng fraction ng isang full sync.

## Tingnan Din

- [Translation Methods](/docs/guides/translation-methods) — Kung paano gumagana ang bawat translation method at kailan ito gagamitin
- [Plugin Specification](/docs/reference/plugin-spec) — Gumawa ng coaching data para sa alinman sa inyong Tier 3 languages
- [CI/CD Guide](/docs/guides/ci-cd) — Advanced CI patterns kasama ang PR preview builds
- [Quality Gate](/docs/concepts/quality-gate) — Kung paano vina-validate ng Rosetta ang bawat translation bago ito isulat
- [Supported Languages](/docs/reference/supported-languages) — Buong listahan ng language codes at method compatibility
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — Magdagdag ng coaching data para sa mga languages na walang malawak na MT coverage