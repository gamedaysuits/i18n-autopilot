---
sidebar_position: 5
title: "Content Translation"
---
# Content Translation (Hugo Markdown)

Tinatranslate po ng Rosetta ang mga Hugo Markdown files — parehong front matter fields at body content — na may full protection sa mga code blocks, shortcodes, at structured elements.

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

## Ano ang mga Natatranslate

### Front Matter

Supported po pareho ang YAML (`---`) at TOML (`+++`) delimiters. By default, ang mga fields na ito ay tinatranslate:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Lahat po ng ibang fields (`date`, `draft`, `tags`, `weight`, `slug`, etc.) ay preserved as-is. Pwede niyo po itong i-customize gamit ang `translatableFields` sa inyong config.

### Body Content

Ang buong Markdown body po ay tinatranslate na may block protection — ang mga structured elements ay naka-shield gamit ang mga Unicode sentinel placeholders bago ang translation at nire-restore pagkatapos.

## Block Protection

Ang mga elements na ito ay dumadaan sa translation nang untouched:

| Element | Example | Protection |
|---------|---------|-----------|
| Code blocks | ``````` ```js ... ``` ``````` | Full block shielded |
| Inline code | `` `variable` `` | Shielded |
| Hugo shortcodes | `{{< figure >}}`, `{{% note %}}` | Full block shielded |
| Raw HTML | `<div>`, `<table>` | Shielded |
| Links (URLs) | `[text](https://...)` | URL preserved, text tinatranslate |
| Interpolation | `{{ .Count }}` | Shielded |

## Filename Convention

Sinusunod po nito ang translation-by-filename pattern ng Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Skip Behavior

Ang mga existing translated files po ay **never overwritten**. Kung nag-eexist na ang `my-post.fr.md`, ini-skip po ito. I-delete ang target file para i-force ang re-translation.

## Markdown-Only Methods

:::warning Google Translate at Markdown
Ang Google Translate po ay **walang awareness** sa mga code blocks, shortcodes, o interpolation variables. Mako-corrupt nito ang structured Markdown content. Gumamit po ng mga LLM methods (`llm` o `llm-coached`) para sa content translation — explicitly nilang shini-shield ang mga structured elements.
:::

Kapag nag-fall back ang content translation mula sa Google Translate papunta sa isang LLM method, naglo-log po ang rosetta ng warning para i-explain kung bakit.