---
sidebar_position: 3
title: "CI/CD"
---
# Integração CI/CD

Automatize as traduções no seu pipeline de build.

## GitHub Actions: Sincronização no Push

Adicione a sincronização de tradução ao seu pipeline de build existente:

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

## GitHub Actions: Sincronização Agendada

Execute as traduções de forma agendada e faça o auto-commit:

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

## Método Google Translate

Se você estiver usando o método integrado do Google Translate em vez do OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## Provedores Diretos de LLM

Se você estiver usando os métodos `openai`, `anthropic` ou `gemini` diretamente:

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

## API de Tradução Remota

Se você estiver usando um endpoint de tradução remota (por exemplo, um serviço de tradução hospedado):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## Pipeline de CI em Três Camadas

Para máxima cobertura de i18n, valide seu pipeline com todas as três ferramentas:

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

| Camada | Comando | Quando | Propósito |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Bloquear commits com strings hardcoded |
| **Sync** | `sync` | Post-commit / CI | Traduzir chaves ausentes e alteradas |
| **Audit** | `audit` | Etapa de build | Falhar o deploy se algum idioma estiver incompleto |

:::tip Translation Memory no CI
Se o seu runner de CI tiver um workspace persistente (ou fizer cache de `.rosetta/`), a Translation Memory entra em ação automaticamente — as sincronizações subsequentes traduzem apenas as chaves cujo texto de origem realmente mudou. Para runners efêmeros, considere fazer cache de `.rosetta/tm.json` entre as execuções:

```yaml
- uses: actions/cache@v4
  with:
    path: .rosetta/tm.json
    key: rosetta-tm-${{ hashFiles('locales/en.json') }}
    restore-keys: rosetta-tm-
```
:::

---

## Veja Também

- [Referência da CLI](/docs/reference/cli) — referência completa de comandos
- [Como o Sync Funciona](/docs/concepts/how-sync-works) — entendendo a sincronização incremental
- [Translation Memory](/docs/concepts/translation-memory) — cache e economia de custos
- [Métodos de Tradução](/docs/guides/translation-methods) — seleção de método por par
- [Quality Gate](/docs/concepts/quality-gate) — o que acontece quando as traduções falham
- [Configuração](/docs/getting-started/configuration) — referência de configuração