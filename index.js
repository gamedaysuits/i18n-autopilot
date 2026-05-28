/**
 * i18n-rosetta — Programmatic API entry point.
 *
 * Re-exports the public API surface for consumers who `import` the package
 * directly (e.g., custom build scripts, programmatic sync, or method class
 * extensions). The CLI (`bin/cli.js`) does NOT use this file — it calls
 * into `lib/` directly.
 *
 * EXPORTS:
 *   - Translation methods: LLM, DirectLLM, LLMCoached, GoogleTranslate, API,
 *     DeepL, MicrosoftTranslator, LibreTranslate, OpenAI, Anthropic, Gemini
 *   - Orchestrator: getMethod, translateBatch, translateRawContent
 *   - Configuration: resolveConfig, generateConfigTemplate, resolvePairs
 *   - Language cards: getLanguageCard, getLanguageReference, getRegister,
 *     getRegisterPresets, getFormality, getGenderGuidance, getAllLanguageCodes,
 *     resolveCode
 *   - Sync: runSync, runContentSync
 *   - Quality: validateTranslations
 *   - Utilities: loadApiKey, getEnvOrFileVar
 */

// ── Translation method classes ─────────────────────────────────────
export { TranslationMethod } from './lib/methods/base.js';
export { LLMMethod } from './lib/methods/llm.js';
export { DirectLLMMethod } from './lib/methods/direct-llm.js';
export { LLMCoachedMethod } from './lib/methods/llm-coached.js';
export { GoogleTranslateMethod } from './lib/methods/google-translate.js';
export { APIMethod } from './lib/methods/api.js';
export { DeepLMethod } from './lib/methods/deepl.js';
export { MicrosoftTranslatorMethod } from './lib/methods/microsoft-translator.js';
export { LibreTranslateMethod } from './lib/methods/libretranslate.js';
export { OpenAIMethod } from './lib/methods/openai.js';
export { AnthropicMethod } from './lib/methods/anthropic.js';
export { GeminiMethod } from './lib/methods/gemini.js';

// ── Translation orchestrator ───────────────────────────────────────
export {
  getMethod,
  translateBatch,
  translateRawContent,
} from './lib/translate.js';

// ── Configuration & pair resolution ────────────────────────────────
export {
  resolveConfig,
  generateConfigTemplate,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_BATCH_SIZE,
} from './lib/config.js';
export { resolvePairs } from './lib/pairs.js';

// ── Language cards & registers ─────────────────────────────────────
export {
  getLanguageCard,
  getLanguageReference,
  getRegister,
  getRegisterPresets,
  getFormality,
  getGenderGuidance,
  getAllLanguageCodes,
  getMethodSupport,
  resolveCode,
} from './lib/registers.js';

// ── Sync pipeline ──────────────────────────────────────────────────
export { runSync, runContentSync } from './lib/sync.js';

// ── Quality gate ───────────────────────────────────────────────────
export { validateTranslations } from './lib/validate.js';

// ── API key resolution ─────────────────────────────────────────────
export { loadApiKey, getEnvOrFileVar } from './lib/api-key.js';

// ── Coaching utilities (for custom method implementations) ─────────
export {
  loadCoachingData,
  findDictionaryMatches,
  buildCoachedSystemMessage,
  buildContentCoachingBlock,
  DEFAULT_COACHING_DIR,
} from './lib/methods/llm-coached.js';

// ── Translation Memory ─────────────────────────────────────────────
export {
  loadTM,
  saveTM,
  lookupTM,
  storeTM,
  partitionByTM,
  tmSize,
} from './lib/tm.js';

// ── XLIFF interchange ──────────────────────────────────────────────
export {
  exportXLIFF,
  importXLIFF,
} from './lib/xliff.js';

// ── ICU MessageFormat ──────────────────────────────────────────────
export {
  isICUString,
  parseICU,
  reassembleICU,
  extractTranslatableSegments,
  getRequiredPluralCategories,
} from './lib/icu.js';

// ── Terminology enforcement ────────────────────────────────────────
export { verifyTerminology } from './lib/terminology.js';

// ── Integrity auditing ─────────────────────────────────────────────
export {
  auditLocalePair,
  formatIntegrityReport,
  checkPluralCategories,
} from './lib/integrity.js';
