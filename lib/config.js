/**
 * Config resolution — finds and merges configuration from multiple sources.
 *
 * Priority (highest to lowest):
 *   1. CLI flags (--source, --dir, --model, --method, etc.)
 *   2. Config file (i18n-rosetta.config.json)
 *   3. Sensible defaults
 *
 * WHY: The goal is zero-config for simple cases (just drop your locale
 * files in a folder and go) while allowing full customization for
 * complex setups with custom registers, models, and batch sizes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_REGISTERS, getLanguageCard, getRegister, resolveCode } from './registers.js';

const CONFIG_FILENAMES = ['i18n-rosetta.config.json'];

// Canonical defaults — import these in any module that needs a fallback
// instead of hardcoding the string/number inline.
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-3.5-flash';
const DEFAULT_BATCH_SIZE = 80;
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_COACHED_TEMPERATURE = 0.2;
const DEFAULT_MAX_RETRIES = 3;  // Max cascade retries on batch parse failure (batch → half → individual)

// Cost estimation heuristics — shared by all provider estimateCost() methods.
// Token-based (LLM providers): ~60 input tokens per i18n key (system prompt + key/value),
// ~10 output tokens per key (translated value only).
// Character-based (API providers): ~25 chars per key average across UI strings.
const EST_INPUT_TOKENS_PER_KEY = 60;
const EST_OUTPUT_TOKENS_PER_KEY = 10;
const EST_CHARS_PER_KEY = 25;

const DEFAULTS = {
  version: 3,
  inputLocale: 'en',
  baseUrl: '',
  localesDir: './locales',
  contentDir: null,  // Hugo content directory (e.g. './content'). null = disabled.
  promptContext: null, // Global context injected into all translation prompts (e.g. "This is a developer tool README")
  translatableFields: null,  // Override DEFAULT_TRANSLATABLE_FIELDS from content.js
  languages: [],
  pairs: null,       // Advanced per-pair overrides (see pairs.js)
  model: DEFAULT_OPENROUTER_MODEL,
  defaultMethod: 'llm',     // Global default: llm, llm-coached, google-translate, api, deepl, microsoft-translator, libretranslate, openai, anthropic, gemini
  batchSize: DEFAULT_BATCH_SIZE,
  temperature: null,  // null = use method default (0.3 standard, 0.2 coached)
  fallbackPrefix: '[EN] ',
  apiKeyEnvVar: 'OPENROUTER_API_KEY',
  format: 'auto',
  lint: {
    srcDir: null,       // Auto-detected from framework
    ignore: ['node_modules', '.next', 'dist', 'build', '.git', 'public', '.vercel'],
    minLength: 2,       // Minimum string length to flag
  },
  seo: {
    urlPattern: '/:locale/:path',
    pages: null,        // null = auto-detect from locale keys or explicit list
  },
  typegen: {
    output: null,       // null = disabled. e.g., './locales.d.ts'
    autoGenerate: false,
  },
};

/**
 * Resolve the full config by merging defaults → config file → CLI args.
 *
 * @param {import('./types.js').CLIArgs} cliArgs - Parsed CLI arguments
 * @param {string} cwd - Working directory to resolve paths from
 * @returns {import('./types.js').RosettaConfig} Fully resolved config
 */
function resolveConfig(cliArgs = {}, cwd = process.cwd()) {
  // Start with defaults
  const config = { ...DEFAULTS };

  // Layer 2: config file
  let configPath;
  if (cliArgs.config) {
    configPath = path.resolve(cwd, cliArgs.config);
  } else {
    // Try each config filename in priority order
    configPath = CONFIG_FILENAMES
      .map(name => path.resolve(cwd, name))
      .find(p => fs.existsSync(p));
  }

  if (configPath && fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Common misspellings / legacy names → correct field name
      const FIELD_ALIASES = {
        sourceLocale: 'inputLocale',
        sourceLang: 'inputLocale',
        source: 'inputLocale',
        locale: 'inputLocale',
        dir: 'localesDir',
        contentDirectory: 'contentDir',
        translatable: 'translatableFields',
        batch: 'batchSize',
        key: 'apiKeyEnvVar',
        apiKey: 'apiKeyEnvVar',
        provider: 'defaultMethod',
        concurrency: 'concurrency',  // valid — not in DEFAULTS but consumed by sync
      };

      // Warn on unknown config fields — prevents silent acceptance of
      // misspelled or unsupported fields that the user expects to work.
      const knownFields = new Set([...Object.keys(DEFAULTS), 'concurrency', 'jsonConcurrency', 'contentConcurrency']);
      for (const key of Object.keys(fileConfig)) {
        if (!knownFields.has(key)) {
          const suggestion = FIELD_ALIASES[key];
          if (suggestion) {
            console.warn(`[WARN] Unknown config field "${key}" — did you mean "${suggestion}"?`);
          } else {
            console.warn(`[WARN] Unknown config field "${key}" in ${path.basename(configPath)} — this field has no effect. Check spelling or see docs for supported fields.`);
          }
        }
      }

      Object.assign(config, fileConfig);
    } catch (err) {
      console.error(`[WARN] Failed to parse config file: ${err.message}`);
    }
  }

  // Layer 3: CLI overrides
  if (cliArgs.source) config.inputLocale = cliArgs.source;
  if (cliArgs.dir) config.localesDir = cliArgs.dir;
  if (cliArgs.model) config.model = cliArgs.model;
  if (cliArgs.method) config.defaultMethod = cliArgs.method;
  if (cliArgs.batchSize) config.batchSize = parseInt(cliArgs.batchSize, 10);
  if (cliArgs.format) config.format = cliArgs.format;
  if (cliArgs.temperature != null) config.temperature = parseFloat(cliArgs.temperature);
  if (cliArgs['content-dir']) config.contentDir = cliArgs['content-dir'];
  if (cliArgs['base-url']) config.baseUrl = cliArgs['base-url'];

  // Concurrency configuration — separate limits for JSON (lightweight) and
  // content (heavy markdown) API calls. --concurrency sets both (backward compat).
  if (cliArgs.concurrency) {
    const val = parseInt(cliArgs.concurrency, 10);
    config.jsonConcurrency = val;
    config.contentConcurrency = val;
  }
  if (cliArgs['json-concurrency']) {
    config.jsonConcurrency = parseInt(cliArgs['json-concurrency'], 10);
  }
  if (cliArgs['content-concurrency']) {
    config.contentConcurrency = parseInt(cliArgs['content-concurrency'], 10);
  }

  // Parse --force-keys: comma-separated dot-notation keys to force re-translate
  config.forceKeys = cliArgs['force-keys']
    ? cliArgs['force-keys'].split(',').map(k => k.trim()).filter(Boolean)
    : [];

  // Docusaurus auto-detection: if format is still 'auto' and docusaurus.config.js
  // exists in the project root, switch to 'docusaurus' mode and use the standard
  // Docusaurus i18n directory. This runs before path resolution so localesDir
  // is correctly resolved to an absolute path below.
  if (config.format === 'auto' && detectDocusaurus(cwd)) {
    config.format = 'docusaurus';
    // Only override localesDir if it's still the default './locales'.
    // If the user explicitly set localesDir in their config, respect that.
    if (config.localesDir === './locales' || config.localesDir === 'locales') {
      config.localesDir = './i18n';
    }
  }

  // Resolve localesDir and contentDir to absolute paths
  config.localesDir = path.resolve(cwd, config.localesDir);
  if (config.contentDir) {
    config.contentDir = path.resolve(cwd, config.contentDir);
  }

  // Resolve the languages config into a normalized map:
  // { "fr": { name: "French", register: "..." }, ... }
  config.resolvedLanguages = resolveLanguages(config);

  return config;
}

/**
 * Normalizes the `languages` config into a consistent map.
 *
 * Supports three input formats:
 *   - Array of codes:    ["fr", "de", "ja"]
 *   - Object with registers: { "fr": "My custom French tone", "de": { register: "..." } }
 *   - Empty (auto-detect from directory)
 *
 * @param {import('./types.js').RosettaConfig} config - Resolved config with languages field
 * @returns {Object<string, import('./types.js').LanguageConfig>} Map of locale code → language config
 */
function resolveLanguages(config) {
  const resolved = {};
  const langs = config.languages;

   if (Array.isArray(langs) && langs.length > 0) {
    // Simple array: ["fr", "de", "ja"]
    for (const code of langs) {
      // Resolve aliases (e.g., 'no' → 'nb', 'iw' → 'he') so pair keys
      // and file operations use the canonical code consistently.
      const canonical = resolveCode(code);
      const card = getLanguageCard(canonical);
      const defaultPresetKey = card?.formality?.default || null;
      resolved[canonical] = {
        name: card?.name || code,
        register: getRegister(canonical),
        // Store the preset key so consumers (e.g., DeepL) can look up
        // preset-specific metadata without reverse-matching prompt text.
        registerPreset: defaultPresetKey,
        dir: card?.dir || 'ltr',
        formalitySystem: card?.formality?.system || null,
      };
    }
  } else if (typeof langs === 'object' && !Array.isArray(langs) && Object.keys(langs).length > 0) {
    // Object form: { "fr": "Custom register", "de": { name: "German", register: "..." } }
    for (const [code, value] of Object.entries(langs)) {
      const canonical = resolveCode(code);
      const card = getLanguageCard(canonical);
      if (typeof value === 'string') {
        // Shorthand: could be a preset key OR custom register text.
        // getRegister() handles both — if it matches a preset key, returns
        // that preset's prompt; otherwise passes through as custom text.
        // Detect whether it's a known preset key to preserve for DeepL/etc.
        const isPresetKey = card?.registers?.[value] != null;
        resolved[canonical] = {
          name: card?.name || code,
          register: getRegister(canonical, value),
          registerPreset: isPresetKey ? value : null,
          dir: card?.dir || 'ltr',
          formalitySystem: card?.formality?.system || null,
        };
      } else if (typeof value === 'object') {
        // Full object form: extract all supported fields.
        // Fields beyond name/register flow through to the pair graph,
        // enabling per-language model/batchSize/maxRetries/script without
        // the more verbose `pairs` config syntax.
        const regValue = value.register || null;
        const isPresetKey = regValue && card?.registers?.[regValue] != null;
        resolved[canonical] = {
          name: value.name || card?.name || code,
          register: regValue
            ? getRegister(canonical, regValue)
            : getRegister(canonical),
          registerPreset: isPresetKey ? regValue : (regValue ? null : card?.formality?.default || null),
          dir: card?.dir || 'ltr',
          formalitySystem: card?.formality?.system || null,
          ...(value.method && { method: value.method }),
          ...(value.model && { model: value.model }),
          ...(value.batchSize && { batchSize: value.batchSize }),
          ...(value.maxRetries != null && { maxRetries: value.maxRetries }),
          ...(value.script && { script: value.script }),
        };
      }
    }
  }
  // If empty, auto-detection happens in sync.js by scanning the directory

  return resolved;
}

/**
 * Auto-detect target languages by scanning the locales directory
 * for locale files (JSON, TOML, or YAML) that aren't the source file.
 *
 * @param {import('./types.js').RosettaConfig} config - Resolved config
 * @returns {Object<string, import('./types.js').LanguageConfig & { filename: string }>} Map of locale code → language config with filename
 */
function autoDetectLanguages(config) {
  const detected = {};
  const inputLocale = config.inputLocale || 'en';

  if (!fs.existsSync(config.localesDir)) return detected;

  // Supported locale file extensions
  const LOCALE_EXTS = ['.json', '.toml', '.yaml', '.yml'];

  const files = fs.readdirSync(config.localesDir)
    .filter(f => {
      const ext = path.extname(f);
      return LOCALE_EXTS.includes(ext);
    })
    .sort();

  for (const file of files) {
    const ext = path.extname(file);
    const code = path.basename(file, ext);

    // Skip source locale
    if (code === inputLocale) continue;

    // Use language card for richer metadata, fall back to backward-compat proxy
    const canonical = resolveCode(code);
    const card = getLanguageCard(canonical);
    detected[code] = {
      name: card?.name || code,
      register: getRegister(canonical),
      registerPreset: card?.formality?.default || null,
      dir: card?.dir || 'ltr',
      formalitySystem: card?.formality?.system || null,
      filename: file,
    };
  }

  return detected;
}

/**
 * Generate a starter config file for `i18n-rosetta init`.
 * Produces v3 format config.
 *
 * @param {string} [localesDir] - Locale files directory (default: './locales')
 * @param {string} [inputLocale] - Source locale code (default: 'en')
 * @returns {string} JSON string of the config template
 */
function generateConfigTemplate(localesDir, inputLocale) {
  return JSON.stringify({
    _setup: 'Add your target language codes to the languages array below. Example: ["fr", "de", "ja"]',
    version: 3,
    inputLocale: inputLocale || 'en',
    baseUrl: '',
    localesDir: localesDir || './locales',
    languages: [],
    model: DEFAULT_OPENROUTER_MODEL,
    batchSize: DEFAULT_BATCH_SIZE,
  }, null, 2);
}

/**
 * Detect if the current project is a Docusaurus site.
 *
 * Checks for the existence of docusaurus.config.js (or .ts) in the
 * given directory. This is the canonical marker for a Docusaurus project.
 *
 * @param {string} cwd - Project root to check
 * @returns {boolean} True if a Docusaurus config file exists
 */
function detectDocusaurus(cwd) {
  return (
    fs.existsSync(path.join(cwd, 'docusaurus.config.js')) ||
    fs.existsSync(path.join(cwd, 'docusaurus.config.ts'))
  );
}

export {
  resolveConfig,
  autoDetectLanguages,
  generateConfigTemplate,
  detectDocusaurus,
  CONFIG_FILENAMES,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_BATCH_SIZE,
  DEFAULT_TEMPERATURE,
  DEFAULT_COACHED_TEMPERATURE,
  EST_INPUT_TOKENS_PER_KEY,
  EST_OUTPUT_TOKENS_PER_KEY,
  EST_CHARS_PER_KEY,
  DEFAULT_MAX_RETRIES,
};
