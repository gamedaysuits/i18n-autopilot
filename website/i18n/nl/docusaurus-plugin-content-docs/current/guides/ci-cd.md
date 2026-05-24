---
sidebar_position: 3
title: "CI/CD"
---
# CI/CD-integratie

Automatiseer vertalingen in uw build pipeline.

## GitHub Actions: Synchroniseren bij push

Voeg vertalingssynchronisatie toe aan uw bestaande build pipeline:

```yaml title=".github/workflows/deploy.yml"
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - run: npm run build
```

## GitHub Actions: Geplande synchronisatie

Voer vertalingen uit volgens een schema en commit automatisch:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync translations
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - name: Commit updated translations
        run: |
          git config user.name "i18n-rosetta"
          git config user.email "bot@example.com"
          git add i18n/ content/ locales/ messages/
          git diff --staged --quiet || git commit -m "chore: sync translations"
          git push
```

## Google Translate-methode

Als u de ingebouwde Google Translate-methode gebruikt in plaats van OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## Directe LLM-providers

Als u de methoden `openai`, `anthropic` of `gemini` direct gebruikt:

```yaml
# OpenAI
- name: Sync translations
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx i18n-rosetta sync --method openai

# Anthropic
- name: Sync translations
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npx i18n-rosetta sync --method anthropic

# Gemini (free tier available)
- name: Sync translations
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npx i18n-rosetta sync --method gemini
```

## DeepL

```yaml
- name: Sync translations
  env:
    DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
  run: npx i18n-rosetta sync --method deepl
```

## Remote Translation API

Als u een remote translation endpoint gebruikt (bijv. een gehoste vertaaldienst):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## Drie-laagse CI-pipeline

Voor maximale i18n-dekking bewaakt u uw pipeline met alle drie de tools:

```yaml
jobs:
  i18n:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      # 1. Catch hardcoded strings before they ship
      - run: npx i18n-rosetta lint

      # 2. Translate missing keys
      - run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      # 3. Fail if any locale is incomplete
      - run: npx i18n-rosetta audit
```

| Laag | Commando | Wanneer | Doel |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Blokkeer commits met hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | Vertaal ontbrekende en gewijzigde keys |
| **Audit** | `audit` | Build-stap | Laat de deployment falen als een locale onvolledig is |

---

## Zie ook

- [CLI-referentie](/docs/reference/cli) — volledige commando-referentie
- [Hoe Sync werkt](/docs/concepts/how-sync-works) — incrementele synchronisatie begrijpen
- [Vertaalmethoden](/docs/guides/translation-methods) — methodeselectie per paar
- [Quality Gate](/docs/concepts/quality-gate) — wat er gebeurt als vertalingen falen
- [Configuratie](/docs/getting-started/configuration) — configuratiereferentie