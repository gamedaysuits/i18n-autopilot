---
sidebar_position: 3
title: "CI/CD"
---
# CI/CD Integration

I-automate ang mga translations sa inyong build pipeline.

## GitHub Actions: Sync on Push

Mag-add po ng translation sync sa inyong existing na build pipeline:

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

## GitHub Actions: Scheduled Sync

I-run ang mga translations on a schedule at mag-auto-commit:

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

## Google Translate Method

Kung gagamitin po ang built-in na Google Translate method imbes na OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## Direct LLM Providers

Kung gagamitin directly ang `openai`, `anthropic`, o `gemini` methods:

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

Kung gagamit po ng remote translation endpoint (halimbawa, isang hosted translation service):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## Three-Layer CI Pipeline

Para sa maximum na i18n coverage, i-gate ang inyong pipeline gamit ang lahat ng tatlong tools:

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

| Layer | Command | Kailan | Purpose |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | I-block ang mga commits na may hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | I-translate ang mga missing at changed keys |
| **Audit** | `audit` | Build step | I-fail ang deployment kung may locale na incomplete |

:::tip Translation Memory sa CI
Kung ang inyong CI runner ay may persistent workspace (o naka-cache ang `.rosetta/`), awtomatikong gagana ang Translation Memory — ang mga susunod na syncs ay magta-translate lang ng mga keys kung saan nagbago talaga ang source text. Para sa mga ephemeral runners, i-consider po na i-cache ang `.rosetta/tm.json` between runs:

```yaml
- uses: actions/cache@v4
  with:
    path: .rosetta/tm.json
    key: rosetta-tm-${{ hashFiles('locales/en.json') }}
    restore-keys: rosetta-tm-
```
:::

---

## Tingnan Din

- [CLI Reference](/docs/reference/cli) — buong command reference
- [How Sync Works](/docs/concepts/how-sync-works) — pag-intindi sa incremental sync
- [Translation Memory](/docs/concepts/translation-memory) — caching at cost savings
- [Translation Methods](/docs/guides/translation-methods) — pagpili ng method per pair
- [Quality Gate](/docs/concepts/quality-gate) — ano ang mangyayari kapag nag-fail ang translations
- [Configuration](/docs/getting-started/configuration) — config reference