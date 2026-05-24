---
sidebar_position: 2
title: "Quick Start"
---
# Quick Start

I-translate ang iyong unang locale file sa loob ng 60 seconds.

## 1. I-set Up ang Iyong Locale Files

Gumawa ng source locale file. Sinusuportahan ng Rosetta ang JSON, TOML, at YAML:

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

## 2. I-set ang Iyong API Key

Pumili ng provider at i-set ang key:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Kumuha ng libreng Gemini key sa [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Kumuha ng OpenRouter key sa [openrouter.ai](https://openrouter.ai).

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

Gagawin ng Rosetta ang mga sumusunod:
1. I-auto-detect ang `locales/en.json` bilang source
2. Hahanapin (o magpo-prompt para sa) mga target language
3. I-translate ang lahat ng keys
4. Isusulat ang `locales/fr.json`, `locales/ja.json`, atbp.
5. Gagawa ng `.i18n-rosetta.lock` para i-track kung ano na ang na-translate

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

Kapag pinalitan niyo po ang isang source string, ide-detect ng rosetta ang pagbabago via SHA-256 hash tracking at ire-retranslate lang ang key na iyon sa susunod na sync:

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

## Optional: Gumawa ng Config File

Para sa mas maraming control, mag-generate ng config file:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

Iga-guide kayo ng wizard sa **register presets** ng bawat language — mga pre-built na tone/formality instructions na naka-tune sa linguistic system nito. Ang French ay may T-V presets (vouvoiement vs tutoiement), ang Korean ay may speech levels (해요체 vs 합쇼체 vs 해체), at ang Japanese ay may keigo options (です/ます vs 丁寧語).

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

I-run ang `npx i18n-rosetta init` para i-browse ang mga available na presets para sa bawat language.

## Optional: Watch Mode

Mag-auto-translate kapag nagbago ang inyong source file:

```bash
npx i18n-rosetta watch
```

## Next Steps

- **[Configuration](/docs/getting-started/configuration)** — Buong config reference
- **[Translation Methods](/docs/guides/translation-methods)** — Piliin ang tamang method
- **[Framework Integration](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — I-automate ang translations sa inyong pipeline