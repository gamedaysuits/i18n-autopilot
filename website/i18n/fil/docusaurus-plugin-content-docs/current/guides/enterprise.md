---
sidebar_position: 7
title: "Para sa Enterprise"
description: "Kung paano ma-standardize ng mga organization ang translation gamit ang leaderboard-proven methods, custom plugins, at one-command deployment."
---
# i18n-rosetta for Enterprise

Regular na nagta-translate ng content ang team niyo. Meron kayong stack ng locale files, isang CI pipeline, at process kung saan malamang may nagma-manual run ng Google Translate, kumokopya ng results sa JSON, at umaasang magiging okay ang lahat. O kaya naman, nagbabayad kayo para sa isang TMS platform kung saan naka-lock in kayo sa translation engine ng iisang vendor.

May mas magandang paraan po para rito.

## The Pitch

1. **Piliin ang best method para sa bawat language** — hindi kung ano lang ang default ng vendor niyo
2. **Mag-deploy with one command** — tina-translate ng `npx i18n-rosetta sync` ang bawat locale, bawat format, every single time
3. **Mag-swap ng methods without changing code** — config change lang, hindi migration
4. **Own your pipeline** — walang vendor lock-in, walang monthly dashboards, walang accounts

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

Sa French, DeepL ang gamit (mas prefer ng team niyo ang European fluency nito). Sa Japanese, frontier LLM. Sa German, Google Translate (mabilis, mura, at good enough). Sa Korean, isang LLM na may formal register. Sa Plains Cree, isang community-built coached plugin na may pinakamataas na score sa leaderboard.

**Same command. Same CI pipeline. Iba't ibang methods per pair. Isang config file.**

## The Leaderboard → Deploy Workflow

:::tip Coming soon: `rosetta leaderboard` CLI
Ang workflow na naka-describe sa ibaba ay ang planned integration sa pagitan ng [MT Eval Arena](https://mtevalarena.org) leaderboard at ng i18n-rosetta CLI. Existing na ang infrastructure sa both sides — in development pa lang ang bridge.
:::

Ang [MT Eval Arena](https://mtevalarena.org) ay kung saan bina-benchmark ang mga translation methods gamit ang reproducible at fingerprinted scoring. Bawat method ay nakakakuha ng composite score across multiple metrics (chrF++, exact match, FST acceptance, semantic scoring). Tinu-track ng leaderboard ang bawat submission.

Ang planned workflow:

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

**Hindi kayo ang magbi-build ng method. Hindi kayo ang magte-train ng model. Pipiliin niyo lang ang winner at ide-deploy ito.** Kung may lumabas na mas magandang method sa leaderboard next month, pwede niyo itong i-swap with one command.

## Ano ang Available Ngayon

In development pa ang leaderboard-to-CLI bridge. Heto ang mga gumagana right now:

### Built-in methods (no plugins needed)

| Method | Best For | Cost |
|--------|----------|------|
| `llm` (default) | Quality-focused, any language | Per-token via OpenRouter |
| `gemini` | Quality + free tier | Free (limited), tapos per-token na |
| `google-translate` | Speed + volume | $20/M characters |
| `deepl` | European languages | $25/M characters |
| `llm-coached` | Languages na may coaching data | Per-token via OpenRouter |
| `api` | Custom/community-hosted methods | Self-hosted |

### Plugin methods (install separately)

Pwedeng i-wrap ng custom plugins ang kahit anong translation logic — isang fine-tuned model, isang FST-gated pipeline, isang community API, o kahit ano pa na nagpo-produce ng JSON. Tingnan ang [Build a Plugin](/docs/tutorials/build-a-plugin).

## Enterprise Workflow

### 1. I-evaluate ang inyong current quality

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. I-run ang eval harness sa mga candidates

Hinahayaan kayo ng [eval harness](https://mtevalarena.org/docs/specifications/harness) na mag-benchmark ng multiple methods laban sa parehong dataset. Mag-run ng sweep, i-compare ang scores, at pumili ng winners:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. I-configure ang per-pair winners

I-update ang config niyo para gamitin ang best method per language pair. Iba't iba ang best methods ng iba't ibang languages — 'yun ang point nito.

### 4. I-integrate sa CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Tatlong commands. Zero manual translation. Sinasalo ng pipeline ang mga hardcoded strings, tina-translate ang mga ito gamit ang chosen methods niyo, at mag-fa-fail ang build kung may nawawala o na-corrupt.

### 5. Professional review (optional)

Para sa high-stakes content, mag-export sa XLIFF para sa human review:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

I-machine-translate ang bulk ng content. I-human-review ang mga critical paths. Magbayad lang para sa human time kung saan ito talaga kailangan.

## Cost Model

Ang rosetta ay **walang license fee, walang monthly subscription, at walang per-seat pricing**. Isa itong open-source CLI tool. Magbabayad lang kayo para sa mga translation API calls:

| Volume | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1,000 keys × 5 locales | ~$0.50 | ~$0.30 (free tier) | ~$2.00 |
| 10,000 keys × 15 locales | ~$15 | ~$8 | ~$60 |
| 50,000 keys × 30 locales | ~$75 | ~$40 | ~$300 |

Dahil sa Translation Memory, magbabayad lang kayo para sa **changed keys** sa mga susunod na syncs. Kung nag-update kayo ng 10 strings out of 10,000, magbabayad lang kayo para sa 10 translations, hindi 10,000.

## vs. TMS Platforms

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Pricing** | Free (open source) + API costs | $50–$500/month + per-seat |
| **Vendor lock-in** | Wala — mag-switch ng providers sa config | Mataas — nasa cloud nila ang data |
| **Method choice** | Any provider, any model, per pair | Kung ano lang ang i-offer nila |
| **CI/CD** | First-class (`lint → sync → audit`) | Plugin/webhook |
| **Custom methods** | Plugin system, community plugins | Not supported |
| **Quality gate** | Built-in (wrong-script, echo, length) | Nag-iiba-iba |
| **Self-hosted** | Oo (LibreTranslate, custom API) | Hindi |

Tingnan ang [full comparison](/docs/guides/comparison) para sa details.

## Further Reading

- **[Quick Start](/docs/getting-started/quick-start)** — i-run ang inyong first sync in 60 seconds
- **[Translation Methods](/docs/guides/translation-methods)** — ang full method menu kasama ang decision tree
- **[CI/CD Integration](/docs/guides/ci-cd)** — i-automate sa inyong pipeline
- **[Working with Professional Translators](/docs/guides/professional-translators)** — XLIFF export/import
- **[MT Eval Arena](https://mtevalarena.org)** — benchmark at leaderboard
- **[Configuration Reference](/docs/getting-started/configuration)** — lahat ng config options