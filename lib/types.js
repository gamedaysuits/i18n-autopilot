/**
 * Shared type definitions for i18n-rosetta.
 *
 * This file contains JSDoc @typedef declarations for the core data shapes
 * that flow between modules. It has no runtime code — it exists only so
 * that editors can resolve type references via imports.
 *
 * USAGE IN OTHER MODULES:
 *   /** @typedef {import('./types.js').PairConfig} PairConfig * /
 *
 *   Or, for VS Code auto-resolution without explicit import, just reference
 *   the type name — jsconfig.json's include paths make these globally visible.
 */

// -----------------------------------------------------------------
// RosettaConfig — the fully resolved project configuration
// Produced by: config.js:resolveConfig()
// Consumed by: sync.js, commands/*, seo.js, lint.js, pairs.js
// -----------------------------------------------------------------

/**
 * @typedef {object} RosettaConfig
 * @property {number} version - Config schema version (currently 3)
 * @property {string} inputLocale - Source locale code (e.g., 'en')
 * @property {string} baseUrl - Site base URL for SEO commands
 * @property {string} localesDir - Absolute path to locale files directory
 * @property {string|null} contentDir - Hugo/Docusaurus content directory, or null if disabled
 * @property {string[]|null} translatableFields - Override for content translatable fields, or null for defaults
 * @property {Array<string>|object} languages - Target languages (array of codes or object with config)
 * @property {Object<string, LanguageConfig>} [resolvedLanguages] - Fully resolved language map (code → config). Set by resolveConfig.
 * @property {object|null} pairs - Advanced per-pair overrides, or null
 * @property {string} model - Default translation model (e.g., 'openai/gpt-4o-mini')
 * @property {string} defaultMethod - Global default method: 'llm', 'google-translate', 'api'
 * @property {number} batchSize - Default batch size for translation calls
 * @property {string} fallbackPrefix - Prefix for untranslated fallback values (default: '[EN] ')
 * @property {string} apiKeyEnvVar - Environment variable name for the API key
 * @property {string} format - Locale file format: 'json', 'toml', 'yaml', 'auto', 'docusaurus'
 * @property {string[]} [forceKeys] - Dot-notation keys to force re-translate (from --force-keys). Set by resolveConfig.
 * @property {{ srcDir: string|null, ignore: string[], minLength: number }} lint - Lint config
 * @property {{ urlPattern: string, pages: string[]|null }} seo - SEO config
 * @property {{ output: string|null, autoGenerate: boolean }} typegen - Type generation config
 */

// -----------------------------------------------------------------
// PairConfig — a single source→target translation pair
// Produced by: pairs.js:resolvePairs(), enriched by plugins.js
// Consumed by: translate.js, methods/*.js, sync.js, provenance.js
// -----------------------------------------------------------------

/**
 * @typedef {object} PairConfig
 * @property {string} source - Source locale code (e.g., 'en')
 * @property {string} target - Target locale code (e.g., 'fr')
 * @property {string} method - Translation method name: 'llm', 'llm-coached', 'google-translate', 'api'
 * @property {string} model - Model identifier (e.g., 'openai/gpt-4o-mini')
 * @property {string} qualityTier - Quality tier: 'standard', 'high', 'research', 'verified'
 * @property {number} batchSize - Max keys per API call
 * @property {number} maxRetries - Max cascade retries on parse failure
 * @property {string} register - Translation register / style instruction
 * @property {string} name - Human-readable language name (e.g., 'French')
 * @property {string} dir - Text direction: 'ltr' or 'rtl'
 * @property {string[]|null} scripts - Available script systems for this language, or null
 * @property {string|null} script - Specific script override, or null
 * @property {string|null} methodPlugin - Plugin name reference, or null
 * @property {Set<string>} _defaults - Fields that were filled from system defaults (used by plugin precedence)
 *
 * --- Plugin-injected fields (present after resolvePluginForPair) ---
 * @property {string} [endpoint] - Plugin API endpoint URL
 * @property {string} [pluginName] - Installed plugin name
 * @property {string} [pluginVersion] - Plugin version string
 * @property {string} [pluginDir] - Absolute path to plugin directory
 * @property {object|null} [pluginBenchmarks] - Plugin quality benchmarks, or null
 * @property {object|null} [pluginProvenance] - Plugin provenance/licensing info, or null
 *
 * --- Validation fields (used by eval harness) ---
 * @property {number} [maxLengthRatio] - Max target/source length ratio for validation
 * @property {number} [minLengthRatio] - Min target/source length ratio for validation
 * @property {number} [maxRepetitionRate] - Max character repetition rate threshold
 * @property {boolean} [requireNonLatin] - Whether to require non-Latin script in output
 */

// -----------------------------------------------------------------
// LanguageConfig — per-language settings from the user's config
// Produced by: config.js (from user's `languages` object)
// Consumed by: pairs.js:resolvePairs()
// -----------------------------------------------------------------

/**
 * @typedef {object} LanguageConfig
 * @property {string} name - Human-readable language name
 * @property {string} register - Translation register / style instruction
 * @property {string} [model] - Per-language model override
 * @property {number} [batchSize] - Per-language batch size override
 * @property {number} [maxRetries] - Per-language max retries override
 * @property {string} [script] - Script system override (e.g., 'syllabics' for Cree)
 */

// -----------------------------------------------------------------
// DiffResult — output of comparing source vs target locale
// Produced by: diff.js:diffLocale()
// Consumed by: sync.js
// -----------------------------------------------------------------

/**
 * @typedef {object} DiffResult
 * @property {string[]} missing - Keys in source but not in target
 * @property {string[]} needsTranslation - Keys with [EN] fallback prefix in target
 * @property {string[]} changed - Keys whose source content hash changed since last sync
 * @property {string[]} forced - Keys explicitly requested for re-translation
 * @property {string[]} extra - Keys in target but not in source (stale/orphaned)
 * @property {string[]} toProcess - Deduplicated union of missing + needsTranslation + changed + forced
 */

// -----------------------------------------------------------------
// CoachingData — linguistic coaching hints for LLM-coached method
// Produced by: llm-coached.js:_loadCoachingData()
// Consumed by: llm-coached.js:buildCoachedSystemMessage/buildCoachedPrompt
// -----------------------------------------------------------------

/**
 * @typedef {object} CoachingData
 * @property {string[]} [grammar_rules] - Grammar rules (e.g., "French adjectives agree in gender/number")
 * @property {Object<string, string>} [dictionary] - Term overrides (e.g., "dashboard" → "tableau de bord")
 * @property {string} [style_notes] - Style guidance (e.g., "Prefer active voice. Avoid anglicisms.")
 */

// -----------------------------------------------------------------
// CLI args shape — parsed CLI arguments passed to command modules
// Produced by: bin/cli.js (util.parseArgs)
// Consumed by: lib/commands/*.js
// -----------------------------------------------------------------

/**
 * @typedef {object} CLIArgs
 * @property {string[]} [_] - Positional arguments (command, subcommand, etc.)
 * @property {boolean} [dry] - Preview changes without writing files
 * @property {boolean} [help] - Show help
 * @property {boolean} [version] - Show version
 * @property {boolean} [fallback] - Write [EN]-prefixed placeholders
 * @property {boolean} [yes] - Skip interactive prompts
 * @property {boolean} [undo] - Restore from backup (wrap command)
 * @property {string} [config] - Custom config file path
 * @property {string} [dir] - Override locales directory
 * @property {string} [source] - Override source locale
 * @property {string} [model] - Override translation model
 * @property {string} [method] - Override translation method
 * @property {string} [format] - Locale file format override
 * @property {string} [out] - Output file path (seo sitemap)
 * @property {string} [src] - Source directory for lint/wrap
 * @property {string} ['content-dir'] - Hugo content directory
 * @property {string} ['base-url'] - Site base URL override
 * @property {string} ['min-length'] - Minimum string length to flag
 * @property {string} ['force-keys'] - Comma-separated keys to force re-translate
 * @property {boolean} ['warn-only'] - Exit 0 even with issues
 */

// Empty export so modules can import types via:
//   /** @typedef {import('./types.js').PairConfig} PairConfig */
export {};
