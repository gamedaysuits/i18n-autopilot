---
sidebar_position: 5
title: "Contentvertaling"
---
# Contentvertaling (Hugo Markdown)

Rosetta vertaalt Hugo Markdown-bestanden — zowel front matter-velden als body content — met volledige bescherming van codeblokken, shortcodes en gestructureerde elementen.

## Configuratie

Stel `contentDir` in uw configuratie in om de vertaling van Markdown-content in te schakelen:

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

## Wat er wordt vertaald

### Front Matter

Zowel YAML- (`---`) als TOML-scheidingstekens (`+++`) worden ondersteund. Standaard worden deze velden vertaald:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Alle andere velden (`date`, `draft`, `tags`, `weight`, `slug`, enz.) blijven ongewijzigd behouden. U kunt dit aanpassen met `translatableFields` in uw configuratie.

### Body Content

De volledige Markdown-body wordt vertaald met blokbescherming — gestructureerde elementen worden vóór de vertaling afgeschermd met behulp van Unicode-sentinel-placeholders en daarna hersteld.

## Blokbescherming

Deze elementen blijven tijdens de vertaling onaangetast:

| Element | Voorbeeld | Bescherming |
|---------|---------|-----------|
| Codeblokken | ``````` ```js ... ``` ``````` | Volledig blok afgeschermd |
| Inline code | `` `variable` `` | Afgeschermd |
| Hugo shortcodes | `{{< figure >}}`, `{{% note %}}` | Volledig blok afgeschermd |
| Ruwe HTML | `<div>`, `<table>` | Afgeschermd |
| Links (URL's) | `[text](https://...)` | URL behouden, tekst vertaald |
| Interpolatie | `{{ .Count }}` | Afgeschermd |

## Bestandsnaamconventie

Volgt het vertaling-per-bestandsnaam patroon van Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Gedrag bij overslaan

Bestaande vertaalde bestanden worden **nooit overschreven**. Als `my-post.fr.md` al bestaat, wordt deze overgeslagen. Verwijder het doelbestand om een hervertaling af te dwingen.

## Markdown-Only methoden

:::warning Google Translate en Markdown
Google Translate heeft **geen besef** van codeblokken, shortcodes of interpolatievariabelen. Het zal gestructureerde Markdown-content beschadigen. Gebruik LLM-methoden (`llm` of `llm-coached`) voor contentvertaling — deze schermen gestructureerde elementen expliciet af.
:::

Wanneer de contentvertaling terugvalt van Google Translate naar een LLM-methode, registreert rosetta een waarschuwing waarin wordt uitgelegd waarom.