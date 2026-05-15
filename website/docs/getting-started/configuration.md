---
sidebar_position: 3
title: Configuration
---

# Configuration

Rosetta works zero-config — it auto-detects locale files, format, and target languages from your project. For more control, create `i18n-rosetta.config.json` in your project root, or run:

```bash
npx i18n-rosetta init
```

## Full Config Reference

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "openai/gpt-4o-mini",
  "defaultMethod": "llm",
  "batchSize": 30,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Config schema version. Always `3`. |
| `inputLocale` | `string` | `"en"` | Source language code (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Path to locale files. Rosetta scans this directory. |
| `contentDir` | `string` | `null` | Hugo content directory. Enables Markdown body translation. |
| `translatableFields` | `string[]` | `null` | Override default translatable frontmatter fields for content translation. `null` uses built-in defaults (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | File format: `json`, `toml`, `yaml`, or `auto` (detect from extension). |
| `model` | `string` | `"openai/gpt-4o-mini"` | Default OpenRouter model for LLM methods. |
| `defaultMethod` | `string` | `"llm"` | Default translation method: `llm`, `llm-coached`, `google-translate`, `api`. Overridden by `--method` CLI flag. |
| `batchSize` | `number` | `30` | Keys per translation batch. Higher = fewer API calls, but larger prompts. |
| `fallbackPrefix` | `string` | `"[EN] "` | Prefix added to untranslated fallback values. Used by `audit` to detect incomplete translations. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Environment variable name for the API key. Override for custom env var names. |
| `baseUrl` | `string` | `""` | Base URL for SEO artifact generation (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Per-pair method, model, and quality overrides. See [Pair Configuration](#pair-configuration). |
| `languages` | `object` | `{}` | Per-language overrides. See [Language Configuration](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Source directory for lint scanning. `null` = auto-detect from framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Glob patterns to exclude from lint. |
| `lint.minLength` | `number` | `2` | Minimum string length to flag as hardcoded. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | URL pattern template for hreflang tag generation. |
| `seo.pages` | `string[]` | `null` | Explicit page list for SEO. `null` = auto-detect from locale keys. |
| `typegen.output` | `string` | `null` | Output path for generated TypeScript types. `null` = disabled. |
| `typegen.autoGenerate` | `boolean` | `false` | Auto-regenerate types after each sync. |

## Pair Configuration

Each source→target pair can be independently configured:

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### Pair Fields

| Field | Type | Description |
|-------|------|-------------|
| `method` | `string` | Translation method: `llm`, `llm-coached`, `google-translate`, `api` |
| `methodPlugin` | `string` | Name of an installed plugin (from `.rosetta/methods/`) |
| `model` | `string` | Override the default model for this pair |
| `endpoint` | `string` | Remote API endpoint URL. Required when `method` is `api`. |
| `qualityTier` | `string` | Display tier: `standard`, `high`, `research`, `verified` |

## Language Configuration

Languages can be configured with a register string (shorthand) or a full object:

```json
{
  "languages": {
    "fr": "Formal academic French. Use vous-form.",
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

### Language Fields

| Field | Type | Description |
|-------|------|-------------|
| `register` | `string` | Style/tone instructions injected into every LLM prompt for this locale |
| `name` | `string` | Human-readable language name (for status display) |
| `model` | `string` | Override the default model |
| `batchSize` | `number` | Override the default batch size |
| `maxRetries` | `number` | Maximum retry budget for failed batches (default: 3) |
| `script` | `string` | ISO 15924 script code. Triggers script validation in the quality gate. |

:::info Inheritance chain
Settings resolve in this order (first wins):

**pair-level** → **language-level** → **global config** → **defaults**

For example, if `pairs["en:fr"]` sets `model`, it overrides both the language-level and global `model` values.
:::

## Non-English Source

If your source language isn't English:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Lock File

Rosetta creates `.i18n-rosetta.lock` to track SHA-256 hashes of translated source values. **Commit this file** so all developers share the same translation baseline.

When a source value changes, the hash no longer matches, and rosetta re-translates that key on the next sync.

## `.rosettaignore`

Create `.rosettaignore` in your project root to exclude files from `lint` scanning. Uses glob patterns, like `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```
