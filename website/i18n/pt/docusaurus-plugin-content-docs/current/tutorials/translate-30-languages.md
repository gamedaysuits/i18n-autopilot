---
sidebar_position: 2
title: "Traduza 30 idiomas"
description: "Cookbook: escale um projeto de 3 para 30 idiomas usando combinação de métodos por par, batching e integração com CI."
---
# Cookbook: Traduzir 30 Idiomas

Escale um projeto de alguns poucos locales para cobertura global. Este cookbook aborda a seleção de métodos, otimização de custos e integração contínua (CI) para um deploy multilíngue real.

**Cenário:** Você tem um app SaaS com `en`, `fr`, `es`. Você precisa adicionar mais 27 idiomas divididos em três níveis de requisitos de qualidade.

---

## Passo 1: Categorize Seus Idiomas

Nem todos os 30 idiomas precisam da mesma abordagem. Agrupe-os pela qualidade do método disponível:

| Nível | Idiomas | Método | Motivo |
|------|-----------|--------|-----|
| **Nível 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Mercados de alto valor, gramática rica em nuances |
| **Nível 2 — Padrão** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Alto volume, bem suportado pelo Google |
| **Nível 3 — Treinado** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Poucos recursos, exigem controle de terminologia |

## Passo 2: Configure por Par

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

**Nota:** Idiomas não listados em `pairs` herdam `defaultMethod: "google-translate"`. Você não precisa listar todos os 30.

:::info
O suporte a `crk` está em desenvolvimento — veja [Apoie um Idioma de Poucos Recursos](/docs/guides/low-resource-languages) para o status e diretrizes de contribuição.
:::

## Passo 3: Configure as Chaves de API

Você precisará de ambas as chaves de API para esta configuração:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Passo 4: Faça um Dry Run Primeiro

Sempre visualize antes de traduzir 30 idiomas:

```bash
npx i18n-rosetta sync --dry
```

Revise a saída. Ela mostrará:
- Quais pares usam qual método
- Quantas chaves são novas/alteradas por locale
- Estimativa de chamadas de API por nível

## Passo 5: Execute a Sincronização

```bash
npx i18n-rosetta sync
```

O Rosetta processa cada par de forma independente. Os pares do Nível 2 usando o Google Translate serão rápidos. Os pares LLM do Nível 1 serão mais lentos, mas com maior qualidade. Os pares treinados do Nível 3 usam os dados de coaching do plugin.

### Atualizações Incrementais

Após a sincronização inicial, as execuções subsequentes traduzem apenas as chaves **alteradas ou novas**:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

O arquivo de lock (`.i18n-rosetta.lock`) rastreia o que foi traduzido, para que você nunca retraduza conteúdo estável.

## Passo 6: Audite a Qualidade

Verifique o status de todos os pares de idiomas:

```bash
npx i18n-rosetta status
```

Isso gera uma tabela mostrando o método, modelo e nível de qualidade de cada par, e se dados de coaching ou pontuações de benchmark estão disponíveis.

## Passo 7: Integração Contínua (CI)

Adicione ao seu fluxo de trabalho do GitHub Actions para que as traduções se mantenham atualizadas a cada push:

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

## Estimativa de Custos

Para um projeto com 500 chaves de origem em 30 idiomas:

| Nível | Idiomas | Método | Custo Aproximado |
|------|-----------|--------|-----------------|
| Nível 1 (5 idiomas) | ja, ko, zh, de, pt | GPT-4o | ~$2,50/sync completa |
| Nível 2 (18 idiomas) | it, nl, pl, etc. | Google Translate | ~$0,90/sync completa |
| Nível 3 (4 idiomas) | crk, oj, mi, haw | GPT-4o-mini treinado | ~$0,40/sync completa |
| **Total** | **30 idiomas** | **Misto** | **~$3,80/sync completa** |

Sincronizações incrementais (5–20 chaves alteradas) custam uma fração de uma sincronização completa.

## Veja Também

- [Métodos de Tradução](/docs/guides/translation-methods) — Como cada método de tradução funciona e quando usá-lo
- [Especificação de Plugin](/docs/reference/plugin-spec) — Crie dados de coaching para qualquer um dos seus idiomas do Nível 3
- [Guia de CI/CD](/docs/guides/ci-cd) — Padrões avançados de CI, incluindo builds de preview para PRs
- [Quality Gate](/docs/concepts/quality-gate) — Como o Rosetta valida cada tradução antes de gravá-la
- [Idiomas Suportados](/docs/reference/supported-languages) — Lista completa de códigos de idioma e compatibilidade de métodos
- [Apoie um Idioma de Poucos Recursos](/docs/guides/low-resource-languages) — Adicione dados de coaching para idiomas sem ampla cobertura de MT