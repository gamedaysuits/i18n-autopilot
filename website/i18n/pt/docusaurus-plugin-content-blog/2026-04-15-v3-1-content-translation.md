---
slug: v3-1-content-translation
title: "v3.1.0: Tradução de conteúdo Hugo Markdown"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
A v3.1.0 adiciona tradução completa de conteúdo Markdown do Hugo — campos de front matter e conteúdo do corpo, com proteção automática para blocos de código, shortcodes e variáveis de interpolação.

<!-- truncate -->

## Tradução Sensível ao Conteúdo

Ao traduzir Markdown, você não pode simplesmente enviar o arquivo bruto para um LLM. Blocos de código são traduzidos. Shortcodes são corrompidos. Variáveis de template do Hugo são danificadas.

O Rosetta v3.1.0 resolve isso com a **blindagem por sentinelas Unicode**:

1. Antes da tradução, blocos estruturados (code fences, shortcodes, código inline, HTML) são substituídos por tokens sentinelas exclusivos
2. O LLM recebe apenas o texto traduzível
3. Após a tradução, as sentinelas são restauradas com o conteúdo original

O LLM nunca vê seus blocos de código. Ele não pode corrompê-los.

## Suporte a Front Matter

Tanto os delimitadores de front matter YAML (`---`) quanto TOML (`+++`) são suportados. Por padrão, `title`, `description`, `summary`, `subtitle`, `caption` e `linkTitle` são traduzidos. Todos os outros campos (date, draft, tags, weight) são preservados.

## Configuração

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Consulte o [guia de Tradução de Conteúdo](/docs/guides/content-translation) para mais detalhes.