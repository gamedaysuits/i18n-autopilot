---
sidebar_position: 3
title: "CI/CD"
---
# Integración de CI/CD

Automatice las traducciones en su pipeline de compilación.

## GitHub Actions: Sincronización al hacer push

Agregue la sincronización de traducciones a su pipeline de compilación existente:

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

## GitHub Actions: Sincronización programada

Ejecute las traducciones de forma programada y realice commits automáticamente:

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

## Método de Google Translate

Si utiliza el método integrado de Google Translate en lugar de OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## Proveedores directos de LLM

Si utiliza los métodos `openai`, `anthropic` o `gemini` directamente:

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

## API de traducción remota

Si utiliza un endpoint de traducción remota (por ejemplo, un servicio de traducción alojado):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## Pipeline de CI de tres capas

Para obtener la máxima cobertura de i18n, valide su pipeline con las tres herramientas:

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

| Capa | Comando | Cuándo | Propósito |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Bloquear commits con cadenas de texto hardcodeadas |
| **Sync** | `sync` | Post-commit / CI | Traducir claves faltantes y modificadas |
| **Audit** | `audit` | Paso de compilación | Hacer fallar el despliegue si algún idioma está incompleto |

---

## Ver también

- [Referencia de la CLI](/docs/reference/cli) — referencia completa de comandos
- [Cómo funciona Sync](/docs/concepts/how-sync-works) — comprender la sincronización incremental
- [Métodos de traducción](/docs/guides/translation-methods) — selección de métodos por par
- [Quality Gate](/docs/concepts/quality-gate) — qué sucede cuando las traducciones fallan
- [Configuración](/docs/getting-started/configuration) — referencia de configuración