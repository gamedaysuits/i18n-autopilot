---
sidebar_position: 3
title: "Configuration"
---
# Configuration

Gumagana po ang Rosetta nang zero-config — nag-a-auto-detect ito ng locale files, format, at target languages mula sa project ninyo. Para sa mas maraming control, gumawa po ng `i18n-rosetta.config.json` sa project root ninyo, o i-run ang:

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
  "jsonConcurrency": 50,
  "contentConcurrency": 12,
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

:::note hindi pa implemented ang typegen
Nare-recognize at nape-preserve ng config loader ang `typegen` config block, pero hindi pa implemented ang TypeScript type generation. Placeholder ito para sa isang planned feature. Walang epekto ang pag-set ng mga values na ito.
:::


### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Config schema version. Laging `3`. |
| `inputLocale` | `string` | `"en"` | Source language code (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Path papunta sa locale files. Ini-scan ng Rosetta ang directory na ito. |
| `contentDir` | `string` | `null` | Hugo content directory. Ine-enable nito ang Markdown body translation. |
| `translatableFields` | `string[]` | `null` | I-override ang default translatable frontmatter fields para sa content translation. Gumagamit ang `null` ng built-in defaults (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | File format: `json`, `toml`, `yaml`, o `auto` (ide-detect mula sa extension). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Default model para sa LLM methods. Nakadepende ang format sa method: Gumagamit ang OpenRouter ng `provider/model` (hal., `google/gemini-3.5-flash`); gumagamit ang direct providers ng bare names (hal., `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Default translation method: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Nao-override ito ng `--method` CLI flag. |
| `batchSize` | `number` | `80` | Keys per translation batch. Mas mataas = mas kaunting API calls, pero mas malalaking prompts. |
| `jsonConcurrency` | `number` | `50` | Max parallel locale translations para sa JSON key sync. Nao-override ng `--json-concurrency` CLI flag. |
| `contentConcurrency` | `number` | `12` | Max parallel API calls para sa content (Markdown/MDX) translation. Nao-override ng `--content-concurrency` CLI flag. |
| `fallbackPrefix` | `string` | `"[EN] "` | Marker prefix na ginagamit ng `audit` at `verify` para ma-detect ang legacy untranslated values mula sa mga nakaraang runs. Hindi isinusulat ng Rosetta ang prefix na ito — binabasa lang nito para sa detection. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Environment variable name para sa API key. I-override para sa custom env var names. |
| `baseUrl` | `string` | `""` | Base URL para sa SEO artifact generation (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Per-pair method, model, at quality overrides. Tingnan ang [Pair Configuration](#pair-configuration). |
| `languages` | `object` | `{}` | Per-language overrides. Tingnan ang [Language Configuration](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Source directory para sa lint scanning. `null` = auto-detect mula sa framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Glob patterns na ie-exclude sa lint. |
| `lint.minLength` | `number` | `2` | Minimum string length para ma-flag bilang hardcoded. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | URL pattern template para sa hreflang tag generation. |
| `seo.pages` | `string[]` | `null` | Explicit page list para sa SEO. `null` = auto-detect mula sa locale keys. |
| `typegen.output` | `string` | `null` | Output path para sa generated TypeScript types. `null` = disabled. |
| `typegen.autoGenerate` | `boolean` | `false` | Mag-auto-regenerate ng types pagkatapos ng bawat sync. |

## Pair Configuration

Ang bawat source→target pair ay pwedeng i-configure nang independently:

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
| `methodPlugin` | `string` | Pangalan ng installed plugin (mula sa `.rosetta/methods/`) |
| `model` | `string` | I-override ang default model para sa pair na ito |
| `endpoint` | `string` | Remote API endpoint URL. Required kapag ang `method` ay `api`. |
| `qualityTier` | `string` | Display tier: `standard`, `high`, `research`, `verified` |

## Language Configuration

Tumatanggap ang languages ng tatlong formats:

### Array of codes (pinakasimple)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Kinukuha ng bawat language ang default register nito mula sa built-in register table. Ang mga languages na walang default ay makakakuha ng `"Professional register."`.

### Object na may register strings

Ang value ay pwedeng maging **preset key** mula sa language card, o custom register text:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Tinitingnan ng Rosetta kung nagma-match ang string sa isang preset key sa language card. Kung oo, gagamitin ang buong register prompt mula sa card. Kung hindi, gagamitin ang string as-is. Tingnan ang [Supported Languages](/docs/reference/supported-languages#language-cards) para sa available presets.

### Object na may full config

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

Pwede po ninyong i-mix ang shorthand at full objects sa iisang block.


### Language Fields

| Field | Type | Description |
|-------|------|-------------|
| `register` | `string` | Style/tone instructions. Pwedeng maging **preset key** (hal., `casual-tu`, `formal-hapsyo`) o custom text. Tingnan ang [Language Cards](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Human-readable language name (para sa status display) |
| `model` | `string` | I-override ang default model |
| `batchSize` | `number` | I-override ang default batch size |
| `maxRetries` | `number` | Maximum retry budget para sa failed batches (default: 3) |
| `script` | `string` | ISO 15924 script code. Nagti-trigger ng script validation sa quality gate. |

:::info Inheritance chain
Nare-resolve ang settings sa ganitong order (first wins):

**pair-level** → **language-level** → **global config** → **defaults**

Halimbawa, kung nag-set ang `pairs["en:fr"]` ng `model`, ino-override nito ang language-level at global `model` values.
:::

## Non-English Source

Kung hindi English ang source language ninyo:

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

Gumagawa ang Rosetta ng `.i18n-rosetta.lock` para i-track ang SHA-256 hashes ng translated source values. **I-commit po ang file na ito** para pare-pareho ang translation baseline ng lahat ng developers.

Kapag nagbago ang isang source value, hindi na magmamatch ang hash, at ire-retranslate ng rosetta ang key na iyon sa susunod na sync.

## `.rosettaignore`

Gumawa po ng `.rosettaignore` sa project root ninyo para i-exclude ang files mula sa `lint` scanning. Gumagamit ito ng glob patterns, tulad ng `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## `.rosetta/` Directory

Gumagawa ang Rosetta ng `.rosetta/` directory sa project root ninyo para sa internal state. Kadalasan ay dapat po ninyo itong **idagdag sa `.gitignore`** — isa itong local optimization, hindi project source:

```gitignore
.rosetta/
```

| File | Purpose | Commit? |
|------|---------|--------|
| `tm.json` | Translation Memory cache — nag-i-store ng mga nakaraang translations na naka-key by source text + locale + method | Hindi (local cache) |
| `xliff/*.xliff` | XLIFF export files para sa professional translator review | Hindi (transient) |
| `methods/` | Installed method plugin manifests | Oo (shared config) |
| `backups/` | Pre-wrap backups (ginawa ng `wrap --undo`) | Hindi (safety net) |

Tingnan ang [Translation Memory](/docs/concepts/translation-memory) para sa mga detalye tungkol sa `tm.json` at kung paano ito nakakatipid sa API costs.

---

## Programmatic API

Para sa build scripts at custom integrations, mag-import nang direkta mula sa package:

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

| Export | Ano ang Ginagawa Nito |
|--------|-------------|
| `TranslationMethod` | Base class para sa lahat ng methods |
| `LLMMethod` | Base class para sa LLM methods (OpenRouter) |
| `DirectLLMMethod` | Base class para sa direct LLM providers (OpenAI, Anthropic, Gemini) |
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

I-extend po ang `DirectLLMMethod` para magdagdag ng bagong LLM provider sa ~40 lines:

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

Makukuha po ninyo nang libre ang translate, coaching, retry loops, model validation, quality tiers, at setup help. Tanging ang HTTP request shape lang ang provider-specific. Para sa non-LLM adapters na gumagamit ng raw `fetch()`, gamitin ang shared `fetchWithRetry()` helper mula sa `lib/methods/fetch-with-retry.js` sa halip na gumawa ng sarili ninyong retry loop.

---

## Tingnan Din

- [CLI Reference](/docs/reference/cli) — lahat ng commands at flags
- [Translation Methods](/docs/guides/translation-methods) — pagpili at pag-mix ng methods
- [Translation Memory](/docs/concepts/translation-memory) — caching at cost savings
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF workflow
- [Plugin Specification](/docs/reference/plugin-spec) — method plugin manifest format
- [Architecture](/docs/concepts/architecture) — kung paano naka-connect ang mga bahagi
- [Supported Languages](/docs/reference/supported-languages) — built-in language support
- [How Sync Works](/docs/concepts/how-sync-works) — ang translation pipeline