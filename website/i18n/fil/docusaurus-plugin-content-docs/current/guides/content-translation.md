---
sidebar_position: 5
title: "Pagsasalin ng Content"
---
# Content Translation (Hugo Markdown)

Tinu-translate ng Rosetta ang mga Hugo Markdown files — parehong front matter fields at body content — na may full protection sa mga code blocks, shortcodes, at structured elements.

## Setup

I-set po ang `contentDir` sa inyong config para ma-enable ang Markdown content translation:

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

## Ano ang mga Nata-translate

### Front Matter

Supported po ang parehong YAML (`---`) at TOML (`+++`) delimiters. By default, nata-translate ang mga fields na ito:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Ang lahat ng iba pang fields (`date`, `draft`, `tags`, `weight`, `slug`, etc.) ay preserved as-is. Pwede niyo po itong i-customize gamit ang `translatableFields` sa inyong config.

### Body Content

Ang buong Markdown body ay nata-translate na may block protection — ang mga structured elements ay naka-shield gamit ang mga Unicode sentinel placeholders bago ang translation at nire-restore pagkatapos.

## Block Protection

Ang mga elements na ito ay hindi ginagalaw during translation:

| Element | Example | Protection |
|---------|---------|-----------|
| Code blocks | ``````` ```js ... ``` ``````` | Full block shielded |
| Inline code | `` `variable` `` | Shielded |
| Hugo shortcodes | `{{< figure >}}`, `{{% note %}}` | Full block shielded |
| Raw HTML | `<div>`, `<table>` | Shielded |
| Links (URLs) | `[text](https://...)` | URL preserved, text nata-translate |
| Interpolation | `{{ .Count }}` | Shielded |

## Filename Convention

Sinusunod nito ang translation-by-filename pattern ng Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Skip Behavior

Ang mga existing translated files ay **never ino-overwrite**. Kung nag-e-exist na ang `my-post.fr.md`, ini-skip po ito. I-delete ang target file para ma-force ang re-translation.

## Markdown-Only Methods

:::warning Google Translate at Markdown
Ang Google Translate ay **walang awareness** sa mga code blocks, shortcodes, o interpolation variables. Mako-corrupt nito ang structured Markdown content. Gumamit po ng mga LLM methods (`llm` o `llm-coached`) para sa content translation — explicitly nilang shini-shield ang mga structured elements.
:::

Kapag nag-fall back ang content translation mula sa Google Translate papunta sa isang LLM method, maglo-log ang rosetta ng warning para i-explain kung bakit.