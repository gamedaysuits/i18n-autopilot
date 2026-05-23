# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.1] - 2026-05-22

### Added
- **Six new translation methods**: Direct API integrations for `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, and `gemini`. Zero external dependencies — all use Node.js built-in `fetch`.
- **Coaching support for direct LLM providers**: `openai`, `anthropic`, and `gemini` methods now load coaching data from `.rosetta/coaching/<locale>.json`, injecting grammar rules into the system prompt and dictionary term overrides into per-batch user messages. Same coaching format as `llm-coached`.
- **Programmatic API** (`index.js`): New package entry point re-exports all method classes, orchestrator, configuration, sync pipeline, quality gate, and coaching utilities. Enables `import { OpenAIMethod } from 'i18n-rosetta'`.
- **Per-method onboarding**: `sync.js` now shows method-specific API key setup instructions with signup URLs when a key is missing (DeepL, Microsoft, LibreTranslate, OpenAI, Anthropic, Gemini).
- **Runtime model validation**: Direct LLM providers now validate model strings before making API calls. Catches three categories of errors:
  - OpenRouter-format strings (`google/gemini-3.5-flash`) used with direct providers — suggests `--method llm`
  - Models from the wrong provider (`claude-*` on OpenAI) — suggests the correct `--method`
  - Deprecated or misspelled model names — fetches the provider's live model list and suggests alternatives
- **`DirectLLMMethod` base class** (`lib/methods/direct-llm.js`): Shared base class for OpenAI, Anthropic, and Gemini. Implements translate, coaching integration, retry loops, and model validation. Subclasses implement only provider-specific HTTP details (~130 lines each vs ~300 before).
- **Model-aware quality tiers**: `getQualityTier()` now returns model-specific tiers: `gpt-4o-mini` → budget, `claude-opus` → premium, `gemini-pro` → premium, etc.
- **56 new tests** (745 → 801): Direct provider unit tests, coaching integration tests with real temp files, MS Translator tests, LibreTranslate tests. Live API integration test (`test/live-provider-coaching.manual.js`) for manual verification.

### Changed
- **Default model names updated**: Anthropic default changed from `claude-3-5-sonnet-latest` (retired) to `claude-sonnet-4-6`. Gemini default changed from `gemini-1.5-flash` (deprecated) to `gemini-2.5-flash`.
- **`package.json`**: Added `exports` and `main` fields pointing to `index.js`. Added `openai`, `anthropic`, `gemini`, `deepl` keywords.
- **Error message standardization**: All providers now use consistent `[WARN] <Provider>: no API key — skipping.` format. Detailed setup help lives in `sync.js`, not in individual method files.
- **DeepL coaching dedup**: DeepL now uses the shared `loadCoachingData` from `llm-coached.js` instead of a local duplicate implementation.

## [3.3.0] - 2026-05-22

### Added
- **Docusaurus i18n support**: Auto-detect Docusaurus projects and sync translations using the native `{message, description}` JSON format. New content discovery functions (`discoverDocusaurusContentFiles`, `getDocusaurusTargetPath`) support the Docusaurus directory-per-locale layout.
- **Docusaurus format helpers** (`lib/format.js`): `isDocusaurusJSON()` detects the `{message, description}` structure. `extractDocusaurusMessages()` and `injectDocusaurusMessages()` handle extraction and round-trip injection of translatable strings.
- **JSDoc type layer**: Comprehensive `@param`/`@returns` annotations across all exported functions. New `lib/types.js` provides shared typedefs (`RosettaConfig`, `PairConfig`, `CLIArgs`, `CoachingData`, `DiffResult`). `jsconfig.json` enables IDE type-checking with zero runtime dependencies — no TypeScript compiler needed.
- **Short CLI flags**: `-h` (help), `-v` (version), `-y` (yes/skip wizard) — standard UNIX conventions.
- **Plugin precedence tracking**: `resolvePairs()` now tracks which fields were filled from system defaults (`_defaults` set). `resolvePluginForPair()` uses this to override only defaulted fields — explicit user configuration is never clobbered by a plugin.
- **Shared string classification** (`lib/string-classify.js`): Extracted common regex heuristics (URL detection, dot-notation, hex colors, template expressions) from `lint.js` and `autofix.js` into a shared module. Both consumers now use identical classification logic.
- **36 new tests** (702 → 738): Docusaurus format helpers, plugin precedence, CLI edge cases (`--force-keys`, subcommand positionals), and `util.parseArgs` validation.

### Changed
- **CLI parser**: Migrated from hand-rolled `argv` loop to Node.js built-in `util.parseArgs` with `strict: false`. Preserves all existing flag behavior while gaining proper type validation for known options.
- **Constants centralized**: `DEFAULT_MODEL` (`google/gemini-3.5-flash`) and `DEFAULT_BATCH_SIZE` (`30`) are now named exports from `config.js`. All consumers (`pairs.js`, `llm.js`, `llm-coached.js`, `translate.js`, `init.js`) import the constants instead of repeating inline literals. Changing the default model or batch size is now a single-line edit.
- **Coached cascade dedup**: `LLMCoachedMethod` now delegates its retry cascade to `LLMMethod.runCascade()` instead of duplicating the full cascade logic. The coached method only provides its custom `batchFn` and label.
- **CI stability**: Workflow matrix now uses `fail-fast: false` so a single flaky test doesn't cancel the entire matrix. Added `timeout-minutes: 5` as a safety net.

### Fixed
- **Missing Docusaurus exports**: `discoverDocusaurusContentFiles` and `getDocusaurusTargetPath` were referenced by `sync.js` but not committed to `content.js`, causing a `SyntaxError` on CI.

## [3.2.0] - 2026-05-14

### Added
- **Quality gate** (`lib/validate.js`): Deterministic validation runs before translations are written to disk. Five checks catch common MT failure modes:
  - Empty/blank output
  - Source echo (model returned the English input)
  - Hallucination loops (trigram repetition analysis, e.g., `"Qo' Qo' Qo'"`)
  - Length inflation (configurable `maxLengthRatio`, default 4×)
  - Script compliance (non-Latin locales must produce non-ASCII output)
- **Retry cascade**: On JSON parse failure, the translation batch automatically retries: full batch → half-batch → individual keys. Budget-capped via `maxRetries` (default 3) to prevent runaway token spend.
- **Prompt caching**: System/user message split across `llm.js`, `llm-coached.js`, and `openrouter-client.js`. The system message (register + rules) is identical across batches for a given locale, enabling provider-level prompt caching (Anthropic, Gemini).
- **Per-language config overrides**: Language definitions now support `model`, `batchSize`, `maxRetries`, and `script` fields. Inheritance chain: pair-level > language-level > global config > defaults.
- **`[GATE]` log prefix**: Quality gate failures are logged to stderr with `[GATE]` prefix, key name, reason, and value preview. No silent fallbacks.
- **Script converter pipeline**: Post-translation orthography conversion runs automatically in the sync pipeline for locales with registered converters. Five converters ship out of the box:
  - Plains Cree SRO → Syllabics (`crk`)
  - Serbian Latin → Cyrillic (`sr`)
  - Klingon Romanization → pIqaD (`tlh`, CSUR PUA)
  - Sindarin Latin → Tengwar, Mode of Beleriand (`x-elvish-s`, CSUR PUA)
  - Latin → Kryptonian (`x-kryptonian`, font-based cipher)
- **`fontNote` metadata**: `getConverterInfo()` now returns font-requirement metadata for PUA-based script converters, so consumers can display rendering instructions.
- **Live cost estimation** (`lib/methods/openrouter-pricing.js` → `lib/pairs.js` → `lib/sync.js`): Pre-sync cost estimates display per-pair breakdown (method, key count, approximate USD) with formatted table output. LLM and coached methods fetch live per-token pricing from the OpenRouter `/api/v1/models` endpoint (cached per-process). Google Translate returns documented rates ($20/1M chars). API returns server-determined. Cost estimation is gated on `OPENROUTER_API_KEY` presence — without a key, no paid translations occur so cost estimation is skipped. Non-blocking: errors in cost estimation never prevent translation.
- **Watch infrastructure hardening** (`lib/watch.js`):
  - Migrated from `fs.watch` (FSEvents) to `fs.watchFile` (stat polling, 500ms interval) for reliable detection across all platforms and filesystem types (including `/tmp` on macOS).
  - `startWatch` is now `async` — initial `runSync` is `await`ed before the watcher registers, eliminating the race condition where sync writes interfered with watcher initialization.
  - Returns a never-resolving Promise to block the CLI's `process.exit()` call, keeping the watch session alive until SIGINT.
  - `[WATCH] Ready` signal emitted after watcher is fully active, enabling deterministic test synchronization.
- **70 new tests** since v3.1.0 across coaching data, cost estimation, script converters, quality gate, retry cascade, and watch lifecycle. Suite total: **702 tests / 163 suites, 100% pass rate**.

### Changed
- `callOpenRouterJSON()` now returns `{ _parseError: true, rawContent, error }` on JSON parse failure instead of `null`. Callers can distinguish "API returned nothing" from "API returned garbage" and retry accordingly.
- `callOpenRouter()` accepts optional `systemMessage` parameter. When provided, messages array becomes `[system, user]` instead of `[user]`. Falls back to single-message format when absent (backward compatible).
- `PAIR_DEFAULTS` now includes `maxRetries: 3`.
- `--fallback` help text clarified: writes `[EN]-prefixed placeholders`, not real translations.
- `lib/commands/watch.js` now `await`s `startWatch()` to properly propagate the async lifecycle.

### Removed
- `test/benchmark/` purged from git history (1.1 GB of scraped site data). Files remain on disk for local dev; excluded from both git (`.gitignore`) and npm (`files` whitelist).

## [3.1.0] - 2026-05-13

### Added
- **`--method` CLI flag**: Override the default translation method from the command line (`llm`, `google-translate`, `api`).
- **Smart method detection**: If `GOOGLE_TRANSLATE_API_KEY` is set but no `OPENROUTER_API_KEY`, auto-switches to Google Translate.
- **Markdown safety warnings**: Google Translate method now warns when content translation falls back to LLM, explaining that Google Translate has no awareness of code blocks, shortcodes, or interpolation variables.
- **Register display**: `init` wizard shows the active register for each selected language. `status` command shows registers with `(default)` or `(custom)` labels.

### Changed
- **Config field standardized**: `inputLocale` is the canonical field. The deprecated `sourceLocale` alias has been removed.
- **Simplified config pipeline**: Removed v2→v3 auto-migration system (no external users to migrate).
- **Pairs use `defaultMethod`**: The pair graph respects the global `defaultMethod` config value, enabling CLI-driven and env-driven method selection.

### Removed
- `lib/migrate.js` — v2→v3 migration system (dead code).
- `sourceLocale` config alias — use `inputLocale` instead.
- v2 compatibility branch in translation dispatch.

## [3.0.0] - 2026-05-12

Initial public release. Per-pair translation engine with pluggable methods.

### Architecture
- **Pair graph** (`lib/pairs.js`): Each source→target pair is independently configurable with method, model, quality tier, batch size, and register.
- **Pluggable methods**: LLM (default), coached LLM, Google Translate, and remote API. Each pair can use a different method.
- **Plugin system** (`lib/plugins.js`): Install, remove, and validate pre-packaged translation recipes (JSON manifests, not code).
- **Pure ESM** with Node.js 20.11+ required.

### Translation Methods
- **LLM** (`lib/methods/llm.js`): Default method via OpenRouter with exponential backoff, key validation, and content-aware Markdown shielding.
- **Google Translate** (`lib/methods/google-translate.js`): Google Cloud Translation API v2 for key-value pairs. API key sent via header.
- **Coached LLM** (`lib/methods/llm-coached.js`): Grammar rules, dictionaries, and style notes injected into LLM prompts.
- **Remote API** (`lib/methods/api.js`): Thin HTTP client for community-hosted or IP-protected endpoints.
- **Script converters** (`lib/scripts.js`): Deterministic transliteration (Simplified↔Traditional Chinese, Cyrillic↔Latin Serbian) — zero-LLM, zero-cost.

### Formats & Content
- JSON, TOML, YAML locale files (auto-detected from file extensions).
- Hugo Markdown translation with front matter + body block protection (code fences, shortcodes, HTML).

### Developer Tools
- `sync`, `watch`, `audit`, `lint`, `wrap`, `seo`, `integrity`, `status`, `provenance`, `plugin` commands.
- Interactive `init` wizard with language preset groups and register display.
- Per-command `--help` for every command.
- JSON Schema for plugin manifests (`schemas/rosetta-plugin.schema.json`).

### Security
- Prototype pollution guard: `__proto__`, `constructor`, `prototype` rejected.
- Path containment: file writes validated to configured directories.
- Response validation: rejects hallucinated keys from LLM responses.
- Adversarial test suite (`test/redteam.test.js`).

### Quality
- 45+ language registers with culturally appropriate tones, RTL hints, and script directions.
- 651 tests across 148 suites — zero external dependencies.
