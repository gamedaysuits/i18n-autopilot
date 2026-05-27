---
sidebar_position: 2
title: "Quick Start"
---
# Quick Start

I-translate po ang inyong unang locale file sa loob ng 60 seconds.

## 1. I-set Up ang Inyong Locale Files

Gumawa po ng source locale file. Sinusuportahan ng Rosetta ang JSON, TOML, at YAML:

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. I-set ang Inyong API Key

Pumili po ng provider at i-set ang key:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Kumuha po ng libreng Gemini key sa [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Kumuha naman ng OpenRouter key sa [openrouter.ai](https://openrouter.ai).

## 3. I-run ang Sync

```bash
npx i18n-rosetta sync
```

:::tip Gumagamit ng Gemini?
Kung pinili niyo po ang Option B (Gemini), i-add ang `--method gemini`:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Ang gagawin po ng Rosetta ay:
1. I-auto-detect ang `locales/en.json` bilang source
2. Hanapin (o mag-prompt para sa) mga target language
3. I-translate ang lahat ng keys
4. I-write ang `locales/fr.json`, `locales/ja.json`, atbp.
5. Gumawa ng `.i18n-rosetta.lock` para i-track kung ano na ang na-translate

## 4. I-check ang Results

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## Ano ang Susunod na Mangyayari?

Kapag pinalitan niyo po ang isang source string, ide-detect ng rosetta ang pagbabago gamit ang SHA-256 hash tracking at ire-re-translate lang ang key na iyon sa susunod na sync:

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

Ang unchanged key (`hero.subtitle`) ay ise-serve mula sa **Translation Memory** cache ng rosetta — walang API call, walang cost. Ang cache ay awtomatikong bini-build sa bawat sync at naka-store sa `.rosetta/tm.json`.

## Optional: Gumawa ng Config File

Para sa higit na control, mag-generate po ng config file:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

Iga-guide po kayo ng wizard sa mga **register presets** ng bawat language — mga pre-built na tone/formality instructions na naka-tune sa linguistic system nito. Ang French ay may T-V presets (vouvoiement vs tutoiement), ang Korean ay may speech levels (해요체 vs 합쇼체 vs 해체), at ang Japanese ay may keigo options (です/ます vs 丁寧語).

O kaya ay gumawa ng config nang manual gamit ang preset keys:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

I-run po ang `npx i18n-rosetta init` para i-browse ang mga available na presets para sa bawat language.

## Optional: Watch Mode

Mag-auto-translate kapag may nagbago sa inyong source file:

```bash
npx i18n-rosetta watch
```

## Next Steps

- **[Configuration](/docs/getting-started/configuration)** — Buong config reference
- **[Translation Methods](/docs/guides/translation-methods)** — Piliin ang tamang method per pair
- **[Translation Memory](/docs/concepts/translation-memory)** — Paano nakakatipid ng pera ang caching sa mga re-run
- **[Working with Professional Translators](/docs/guides/professional-translators)** — Mag-export ng XLIFF para sa human review
- **[Framework Integration](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — I-automate ang mga translation sa inyong pipeline
- **[Troubleshooting](/docs/guides/troubleshooting)** — Mga common na issue at solution