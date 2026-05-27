---
sidebar_position: 3
title: "CI/CD"
---
# Intégration CI/CD

Automatisez les traductions dans votre pipeline de build.

## GitHub Actions : Synchronisation lors du Push

Ajoutez la synchronisation des traductions à votre pipeline de build existant :

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

## GitHub Actions : Synchronisation planifiée

Exécutez les traductions selon une planification et effectuez un commit automatique :

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

## Méthode Google Translate

Si vous utilisez la méthode Google Translate intégrée au lieu d'OpenRouter :

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## Fournisseurs LLM directs

Si vous utilisez directement les méthodes `openai`, `anthropic` ou `gemini` :

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

## API de traduction distante

Si vous utilisez un point de terminaison de traduction distant (par exemple, un service de traduction hébergé) :

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## Pipeline CI à trois couches

Pour une couverture i18n maximale, contrôlez votre pipeline avec ces trois outils :

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

| Couche | Commande | Quand | Objectif |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Bloquer les commits contenant des chaînes codées en dur |
| **Sync** | `sync` | Post-commit / CI | Traduire les clés manquantes et modifiées |
| **Audit** | `audit` | Étape de build | Faire échouer le déploiement si une locale est incomplète |

:::tip Translation Memory dans la CI
Si votre exécuteur CI (runner) dispose d'un espace de travail persistant (ou met en cache `.rosetta/`), la Translation Memory s'active automatiquement — les synchronisations ultérieures ne traduisent que les clés dont le texte source a réellement changé. Pour les exécuteurs éphémères, envisagez de mettre en cache `.rosetta/tm.json` entre les exécutions :

```yaml
- uses: actions/cache@v4
  with:
    path: .rosetta/tm.json
    key: rosetta-tm-${{ hashFiles('locales/en.json') }}
    restore-keys: rosetta-tm-
```
:::

---

## Voir aussi

- [Référence de la CLI](/docs/reference/cli) — référence complète des commandes
- [Comment fonctionne la synchronisation](/docs/concepts/how-sync-works) — comprendre la synchronisation incrémentielle
- [Translation Memory](/docs/concepts/translation-memory) — mise en cache et réduction des coûts
- [Méthodes de traduction](/docs/guides/translation-methods) — sélection de la méthode par paire
- [Quality Gate](/docs/concepts/quality-gate) — que se passe-t-il en cas d'échec des traductions
- [Configuration](/docs/getting-started/configuration) — référence de la configuration