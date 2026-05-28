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
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 80,
  "jsonConcurrency": 200,
  "contentConcurrency": 48,
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

:::note typegen is not yet implemented
The `typegen` config block is recognized and preserved by the config loader, but TypeScript type generation is not yet implemented. This is a placeholder for a planned feature. Setting these values has no effect.
:::


### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Config schema version. Always `3`. |
| `inputLocale` | `string` | `"en"` | Source language code (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Path to locale files. Rosetta scans this directory. |
| `contentDir` | `string` | `null` | Hugo content directory. Enables Markdown body translation. |
| `translatableFields` | `string[]` | `null` | Override default translatable frontmatter fields for content translation. `null` uses built-in defaults (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | File format: `json`, `toml`, `yaml`, or `auto` (detect from extension). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Default model for LLM methods. Format depends on method: OpenRouter uses `provider/model` (e.g., `google/gemini-3.5-flash`); direct providers use bare names (e.g., `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Default translation method: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Overridden by `--method` CLI flag. |
| `batchSize` | `number` | `80` | Keys per translation batch. Higher = fewer API calls, but larger prompts. |
| `jsonConcurrency` | `number` | `200` | Max parallel locale translations for JSON key sync. Overridden by `--json-concurrency` CLI flag. |
| `contentConcurrency` | `number` | `48` | Max parallel API calls for content (Markdown/MDX) translation. Overridden by `--content-concurrency` CLI flag. |
| `fallbackPrefix` | `string` | `"[EN] "` | Marker prefix used by `audit` and `verify` to detect legacy untranslated values from prior runs. Rosetta does not write this prefix — it only reads it for detection. |
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
| `method` | `string` | Translation method: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Name of an installed plugin (from `.rosetta/methods/`) |
| `model` | `string` | Override the default model for this pair |
| `endpoint` | `string` | Remote API endpoint URL. Required when `method` is `api`. |
| `qualityTier` | `string` | Display tier: `standard`, `high`, `research`, `verified` |

## Language Configuration

Languages accept three formats:

### Array of codes (simplest)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Each language gets its default register from the built-in register table. Languages without a default get `"Professional register."`.

### Object with register strings

The value can be a **preset key** from the language's card, or custom register text:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta checks if the string matches a preset key in the language card. If it does, the full register prompt from the card is used. If not, the string is used as-is. See [Supported Languages](/docs/reference/supported-languages#language-cards) for available presets.

### Object with full config

```json
{
  "languages": {
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

You can mix shorthand and full objects in the same block.


### Language Fields

| Field | Type | Description |
|-------|------|-------------|
| `register` | `string` | Style/tone instructions. Can be a **preset key** (e.g., `casual-tu`, `formal-hapsyo`) or custom text. See [Language Cards](/docs/reference/supported-languages#language-cards). |
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

## `.rosetta/` Directory

Rosetta creates a `.rosetta/` directory in your project root for internal state. You should generally **add this to `.gitignore`** — it's local optimization, not project source:

```gitignore
.rosetta/
```

| File | Purpose | Commit? |
|------|---------|--------|
| `tm.json` | Translation Memory cache — stores previous translations keyed by source text + locale + method | No (local cache) |
| `xliff/*.xliff` | XLIFF export files for professional translator review | No (transient) |
| `methods/` | Installed method plugin manifests | Yes (shared config) |
| `backups/` | Pre-wrap backups (created by `wrap --undo`) | No (safety net) |

See [Translation Memory](/docs/concepts/translation-memory) for details on `tm.json` and how it saves API costs.

---

## Programmatic API

For build scripts and custom integrations, import directly from the package:

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Available Exports

| Export | What It Does |
|--------|-------------|
| `TranslationMethod` | Base class for all methods |
| `LLMMethod` | Base class for LLM methods (OpenRouter) |
| `DirectLLMMethod` | Base class for direct LLM providers (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Direct LLM provider classes |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Traditional MT classes |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Coached LLM (OpenRouter + coaching data) |
| `APIMethod` | Remote API client |
| `runSync`, `runContentSync` | Full sync pipeline |
| `resolveConfig`, `resolvePairs` | Config resolution |
| `validateTranslations` | Quality gate |
| `loadCoachingData`, `findDictionaryMatches` | Coaching utilities |

### Custom Provider Extension

Extend `DirectLLMMethod` to add a new LLM provider in ~40 lines:

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

You get translate, coaching, retry loops, model validation, quality tiers, and setup help for free. Only the HTTP request shape is provider-specific. For non-LLM adapters that use raw `fetch()`, use the shared `fetchWithRetry()` helper from `lib/methods/fetch-with-retry.js` instead of writing your own retry loop.

---

## See Also

- [CLI Reference](/docs/reference/cli) — all commands and flags
- [Translation Methods](/docs/guides/translation-methods) — choosing and mixing methods
- [Translation Memory](/docs/concepts/translation-memory) — caching and cost savings
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF workflow
- [Plugin Specification](/docs/reference/plugin-spec) — method plugin manifest format
- [Architecture](/docs/concepts/architecture) — how the pieces connect
- [Supported Languages](/docs/reference/supported-languages) — built-in language support
- [How Sync Works](/docs/concepts/how-sync-works) — the translation pipeline

