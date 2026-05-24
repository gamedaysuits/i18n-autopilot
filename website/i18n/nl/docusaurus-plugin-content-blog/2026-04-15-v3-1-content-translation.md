---
slug: v3-1-content-translation
title: "v3.1.0: Hugo Markdown-contentvertaling"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0 voegt volledige vertaling van Hugo Markdown-content toe — front matter-velden en body-content, met automatische bescherming voor code blocks, shortcodes en interpolatievariabelen.

<!-- truncate -->

## Content-bewuste vertaling

Bij het vertalen van Markdown kunt u niet zomaar het ruwe bestand naar een LLM sturen. Code blocks worden vertaald. Shortcodes raken beschadigd. Hugo template-variabelen worden verminkt.

Rosetta v3.1.0 lost dit op met **Unicode sentinel shielding**:

1. Voorafgaand aan de vertaling worden gestructureerde blokken (code fences, shortcodes, inline code, HTML) vervangen door unieke sentinel tokens
2. De LLM ontvangt alleen vertaalbare tekst
3. Na de vertaling worden de sentinels hersteld met de originele content

De LLM ziet uw code blocks nooit. Het kan ze niet beschadigen.

## Front Matter-ondersteuning

Zowel YAML (`---`) als TOML (`+++`) front matter-scheidingstekens worden ondersteund. Standaard worden `title`, `description`, `summary`, `subtitle`, `caption` en `linkTitle` vertaald. Alle andere velden (date, draft, tags, weight) blijven behouden.

## Setup

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Raadpleeg de [Content Translation-gids](/docs/guides/content-translation) voor meer informatie.