---
sidebar_position: 5
title: "Tradução de Conteúdo"
---
# Tradução de Conteúdo (Hugo Markdown)

O Rosetta traduz arquivos Markdown do Hugo — tanto os campos do front matter quanto o conteúdo do corpo — com proteção total de blocos de código, shortcodes e elementos estruturados.

## Configuração

Defina `contentDir` na sua configuração para habilitar a tradução de conteúdo Markdown:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## O Que É Traduzido

### Front Matter

Tanto os delimitadores YAML (`---`) quanto TOML (`+++`) são suportados. Por padrão, estes campos são traduzidos:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Todos os outros campos (`date`, `draft`, `tags`, `weight`, `slug`, etc.) são preservados como estão. Personalize com `translatableFields` na sua configuração.

### Conteúdo do Corpo

Todo o corpo do Markdown é traduzido com proteção de bloco — elementos estruturados são protegidos usando marcadores sentinelas Unicode antes da tradução e restaurados depois.

## Proteção de Bloco

Estes elementos passam pela tradução intactos:

| Elemento | Exemplo | Proteção |
|---------|---------|-----------|
| Blocos de código | ``````` ```js ... ``` ``````` | Bloco completo protegido |
| Código inline | `` `variável` `` | Protegido |
| Shortcodes do Hugo | `{{< figure >}}`, `{{% note %}}` | Bloco completo protegido |
| HTML bruto | `<div>`, `<table>` | Protegido |
| Links (URLs) | `[text](https://...)` | URL preservada, texto traduzido |
| Interpolação | `{{ .Count }}` | Protegida |

## Convenção de Nome de Arquivo

Segue o padrão de tradução por nome de arquivo do Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Comportamento de Ignorar

Arquivos traduzidos existentes **nunca são sobrescritos**. Se `my-post.fr.md` já existir, ele será ignorado. Exclua o arquivo de destino para forçar uma nova tradução.

## Métodos Exclusivos para Markdown

:::warning Google Translate e Markdown
O Google Translate **não tem conhecimento** de blocos de código, shortcodes ou variáveis de interpolação. Ele corromperá o conteúdo Markdown estruturado. Use métodos LLM (`llm` ou `llm-coached`) para a tradução de conteúdo — eles protegem explicitamente os elementos estruturados.
:::

Quando a tradução de conteúdo faz o fallback do Google Translate para um método LLM, o rosetta registra um aviso explicando o motivo.