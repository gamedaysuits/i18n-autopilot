---
slug: v3-1-content-translation
title: "v3.1.0: Hugo Markdown Content Translation"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---

v3.1.0 adds full Hugo Markdown content translation — front matter fields and body content, with automatic protection for code blocks, shortcodes, and interpolation variables.

<!-- truncate -->

## Content-Aware Translation

When translating Markdown, you can't just send the raw file to an LLM. Code blocks get translated. Shortcodes get corrupted. Hugo template variables get mangled.

Rosetta v3.1.0 solves this with **Unicode sentinel shielding**:

1. Before translation, structured blocks (code fences, shortcodes, inline code, HTML) are replaced with unique sentinel tokens
2. The LLM receives only translatable text
3. After translation, sentinels are restored with the original content

The LLM never sees your code blocks. It can't corrupt them.

## Front Matter Support

Both YAML (`---`) and TOML (`+++`) front matter delimiters are supported. By default, `title`, `description`, `summary`, `subtitle`, `caption`, and `linkTitle` are translated. All other fields (date, draft, tags, weight) are preserved.

## Setup

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

See the [Content Translation guide](/docs/guides/content-translation) for details.
