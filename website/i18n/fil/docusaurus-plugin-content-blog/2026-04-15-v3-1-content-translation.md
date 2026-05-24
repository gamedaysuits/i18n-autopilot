---
slug: v3-1-content-translation
title: "v3.1.0: Translation ng Hugo Markdown Content"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
Ang v3.1.0 po ay nagdadagdag ng full Hugo Markdown content translation — front matter fields at body content, na may automatic protection para sa mga code blocks, shortcodes, at interpolation variables.

<!-- truncate -->

## Content-Aware Translation

Kapag nagta-translate po ng Markdown, hindi pwedeng i-send lang ang raw file sa isang LLM. Nata-translate ang mga code blocks. Nako-corrupt ang mga shortcodes. Nasisira ang mga Hugo template variables.

Sinu-solve po ito ng Rosetta v3.1.0 gamit ang **Unicode sentinel shielding**:

1. Bago mag-translate, ang mga structured blocks (code fences, shortcodes, inline code, HTML) ay pinapalitan ng mga unique sentinel tokens
2. Nare-receive lang ng LLM ang translatable text
3. Pagkatapos mag-translate, nire-restore ang mga sentinels gamit ang original content

Hindi po nakikita ng LLM ang inyong mga code blocks. Hindi nito mako-corrupt ang mga ito.

## Front Matter Support

Parehong supported po ang YAML (`---`) at TOML (`+++`) front matter delimiters. By default, nata-translate ang `title`, `description`, `summary`, `subtitle`, `caption`, at `linkTitle`. Naka-preserve naman ang lahat ng iba pang fields (date, draft, tags, weight).

## Setup

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Tingnan po ang [Content Translation guide](/docs/guides/content-translation) para sa karagdagang details.