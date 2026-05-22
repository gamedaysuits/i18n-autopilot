/**
 * LLM-Coached Translation Method — grammar/dictionary-injected LLM prompting.
 *
 * This method sits between raw LLM translation and a full FST-gated pipeline.
 * It injects developer-provided linguistic hints into the prompt before each
 * translation batch, giving the LLM explicit guidance for languages where
 * naive prompting produces frequent errors.
 *
 * HOW IT WORKS:
 *   1. Loads coaching data from .rosetta/coaching/<locale>.json
 *   2. For each batch, builds an augmented prompt with:
 *      a) Grammar rules (e.g., "French adjectives agree in gender/number")
 *      b) Dictionary overrides (e.g., "dashboard" → "tableau de bord")
 *      c) Style notes (e.g., "Prefer active voice, avoid anglicisms")
 *   3. Scans source values for dictionary matches and injects explicit hints
 *   4. Delegates the actual API call to the LLM method's infrastructure
 *
 * COACHING DATA FORMAT (.rosetta/coaching/<locale>.json):
 *   {
 *     "grammar_rules": [
 *       "French adjectives agree in gender and number with the noun",
 *       "Use 'vous' for formal contexts, 'tu' for informal"
 *     ],
 *     "dictionary": {
 *       "dashboard": "tableau de bord",
 *       "deployment": "déploiement",
 *       "settings": "paramètres"
 *     },
 *     "style_notes": "Prefer active voice. Avoid anglicisms where a native French term exists."
 *   }
 *
 * WHY .rosetta/ AND NOT localesDir/:
 *   Coaching data is a development tool artifact, not a deployable asset.
 *   Locale files in localesDir/ get bundled into the app. Coaching hints
 *   are tool configuration — they live in the project's .rosetta/ directory,
 *   following the same convention as .husky/, .eslintrc/, etc.
 *
 * COST PROFILE: ~$0.02–0.04 per 1k keys (longer prompts from coaching context)
 * QUALITY TIER: high
 */

import path from 'node:path';
import fs from 'node:fs';
import { TranslationMethod } from './base.js';
import { callOpenRouterJSON } from './openrouter-client.js';
import { estimateOpenRouterCost } from './openrouter-pricing.js';

// Re-use the LLM method's infrastructure (prompt building, key validation, cascade)
import { LLMMethod, inferKeyTypes, isUnsafeKey, buildSystemMessage } from './llm.js';
import { DEFAULT_MODEL, DEFAULT_BATCH_SIZE } from '../config.js';

/**
 * Default coaching data directory, relative to project root.
 * Users can override via config: coaching.dir
 */
const DEFAULT_COACHING_DIR = '.rosetta/coaching';

class LLMCoachedMethod extends TranslationMethod {
  constructor(options = {}) {
    super('llm-coached', options);
    this._coachingCache = new Map();
  }

  /**
   * Translate a batch of key-value pairs with coaching augmentation.
   *
   * Strategy:
   *   1. Load coaching data for the target locale
   *   2. If no coaching data exists, fall back to plain LLM method
   *   3. If coaching data exists, build augmented prompts and translate
   *
   * @param {string[]} keys - Flat dot-notation keys to translate
   * @param {object} sourceFlat - Full flattened source locale
   * @param {object} pairConfig - Pair config (method, model, register, name, etc.)
   * @param {object} options - { apiKey, batchSize, cwd }
   * @returns {object|null} Map of key → translated value, or null
   */
  async translate(keys, sourceFlat, pairConfig, options) {
    const { apiKey } = options;
    if (!apiKey) {
      console.error('     [WARN] LLM-Coached translate: no API key provided — skipping batch.');
      return null;
    }

    // Resolve the target locale from the pair config
    const targetLocale = pairConfig.target || pairConfig.locale;
    const cwd = options.cwd || process.cwd();
    const coachingDir = options.coachingDir || path.join(cwd, DEFAULT_COACHING_DIR);

    // Load coaching data for this locale
    const coaching = this._loadCoachingData(coachingDir, targetLocale);

    if (!coaching) {
      // No coaching data — fall back to plain LLM with a note
      console.error(`\n     [INFO] No coaching data for "${targetLocale}" at ${coachingDir}/${targetLocale}.json`);
      console.error('         Falling back to standard LLM method. Create coaching data for better results.\n');
      const fallback = new LLMMethod();
      return fallback.translate(keys, sourceFlat, pairConfig, options);
    }

    // Translate with coaching-augmented prompts using system/user split.
    // The system message includes base rules + coaching context (grammar, dictionary, style).
    // This is identical across batches for a locale, so providers cache it automatically.
    const batchSize = pairConfig.batchSize || options.batchSize || DEFAULT_BATCH_SIZE;
    const model = pairConfig.model || options.model || DEFAULT_MODEL;
    const maxRetries = pairConfig.maxRetries ?? 3;
    const langConfig = {
      name: pairConfig.name,
      register: pairConfig.register,
    };

    // Build system message once — base rules + coaching context
    const systemMessage = buildCoachedSystemMessage(langConfig, coaching);

    const allTranslated = {};

    // Delegate cascade to LLMMethod via composition — the coached method
    // wraps its _callCoachedBatch in a closure that binds the coaching data,
    // then passes it as the batchFn to the shared cascade logic.
    // Both are invariant across batches, so we create them once.
    const llm = new LLMMethod();
    const batchFn = (batch, opts) => this._callCoachedBatch(batch, coaching, opts);

    for (let i = 0; i < keys.length; i += batchSize) {
      const chunk = keys.slice(i, i + batchSize);
      const toTranslate = {};
      for (const key of chunk) {
        toTranslate[key] = sourceFlat[key];
      }

      const batchNum = Math.floor(i / batchSize) + 1;

      const result = await llm._translateWithCascade(toTranslate, langConfig, {
        apiKey,
        model,
        batchNum,
        maxRetries,
        systemMessage,
      }, batchFn, 'Coached ');

      if (result) {
        Object.assign(allTranslated, result);
      }
    }

    return Object.keys(allTranslated).length > 0 ? allTranslated : null;
  }

  /**
   * Translate freeform content with coaching context.
   *
   * For content translation, we prepend coaching style notes and grammar
   * rules to the existing prompt (which already contains the content).
   */
  async translateContent(prompt, pairConfig, options) {
    const { apiKey } = options;
    if (!apiKey) {
      console.error('     [WARN] LLM-Coached translateContent: no API key provided — skipping.');
      return null;
    }

    const targetLocale = pairConfig.target || pairConfig.locale;
    const cwd = options.cwd || process.cwd();
    const coachingDir = options.coachingDir || path.join(cwd, DEFAULT_COACHING_DIR);

    const coaching = this._loadCoachingData(coachingDir, targetLocale);

    if (!coaching) {
      // No coaching data — plain LLM fallback
      const fallback = new LLMMethod();
      return fallback.translateContent(prompt, pairConfig, options);
    }

    // Augment the content prompt with coaching context
    const coachingBlock = buildContentCoachingBlock(coaching);
    const augmentedPrompt = coachingBlock + '\n\n' + prompt;

    // Delegate to LLM method for the actual API call
    const fallback = new LLMMethod();
    return fallback.translateContent(augmentedPrompt, pairConfig, options);
  }

  /**
   * Cost estimation — same as LLM but with coached:true flag
   * for the 2.5x input token multiplier (grammar/dictionary injection).
   *
   * @param {number} keyCount - Number of keys to translate
   * @param {object} [pairConfig] - Pair config containing the model ID
   */
  async estimateCost(keyCount, pairConfig = {}) {
    const model = pairConfig.model || DEFAULT_MODEL;
    return estimateOpenRouterCost(keyCount, model, { coached: true });
  }

  getQualityTier() {
    return 'high';
  }

  getProvenance() {
    return {
      resources: [
        { name: 'User-provided coaching data', license: 'project-local', type: 'dictionary/grammar' },
      ],
      commercialReady: true,
      flags: [],
    };
  }

  // -----------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------

  /**
   * Load coaching data for a locale, with caching.
   *
   * @param {string} coachingDir - Path to coaching data directory
   * @param {string} locale - Target locale code
   * @returns {object|null} Coaching data, or null if not found
   */
  _loadCoachingData(coachingDir, locale) {
    if (!locale) return null;

    // Check cache first
    const cacheKey = `${coachingDir}:${locale}`;
    if (this._coachingCache.has(cacheKey)) {
      return this._coachingCache.get(cacheKey);
    }

    const filePath = path.join(coachingDir, `${locale}.json`);

    if (!fs.existsSync(filePath)) {
      this._coachingCache.set(cacheKey, null);
      return null;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // Validate required structure
      const coaching = {
        grammar_rules: Array.isArray(data.grammar_rules) ? data.grammar_rules : [],
        dictionary: (data.dictionary && typeof data.dictionary === 'object') ? data.dictionary : {},
        style_notes: typeof data.style_notes === 'string' ? data.style_notes : '',
      };

      this._coachingCache.set(cacheKey, coaching);
      return coaching;
    } catch (err) {
      console.error(`\n     [WARN] Failed to load coaching data: ${filePath}`);
      console.error(`         ${err.message}\n`);
      this._coachingCache.set(cacheKey, null);
      return null;
    }
  }

  // NOTE: The coached cascade (_translateCoachedWithCascade) was removed.
  // Coached translation now delegates to LLMMethod._translateWithCascade
  // via composition, passing _callCoachedBatch as the batchFn parameter.
  // This eliminates ~80 lines of duplicated cascade logic.

  /**
   * Make a single coached API call via the shared OpenRouter client.
   * Builds per-batch user message with dictionary hints, uses shared system message.
   */
  async _callCoachedBatch(toTranslate, coaching, options) {
    const { apiKey, model, batchNum, systemMessage } = options;

    // Build per-batch user message with dictionary hints specific to this batch's values
    const dictHints = findDictionaryMatches(toTranslate, coaching.dictionary);
    const typeHints = inferKeyTypes(toTranslate);

    let userMessage = '';
    if (dictHints.length > 0) {
      userMessage += 'REQUIRED TERMINOLOGY (use these exact translations):\n';
      userMessage += dictHints.map(h => `  • "${h.term}" → "${h.translation}"`).join('\n');
      userMessage += '\n\n';
    }
    if (typeHints.length > 0) {
      userMessage += `UI context for these keys:\n${typeHints.join('\n')}\n\n`;
    }
    userMessage += JSON.stringify(toTranslate, null, 2);

    return callOpenRouterJSON({
      prompt: userMessage,
      systemMessage,
      apiKey,
      model,
      temperature: 0.2, // Lower than standard for coached (more deterministic)
      label: `Coached batch ${batchNum}`,
      xTitle: 'i18n-rosetta (coached)',
      expectedKeys: new Set(Object.keys(toTranslate)),
      isUnsafeKey,
    });
  }

}

// -----------------------------------------------------------------
// Coached prompt building
// -----------------------------------------------------------------

/**
 * Build the system message for coached translation (cached across batches).
 *
 * Contains: base translation rules + coaching context (grammar, style).
 * Dictionary hints are NOT included here because they vary per batch
 * (only terms present in that batch's values are injected).
 *
 * @param {object} langConfig - { name, register }
 * @param {object} coaching - { grammar_rules, dictionary, style_notes }
 * @returns {string} System message for prompt caching
 */
function buildCoachedSystemMessage(langConfig, coaching) {
  // Start with the base system message (register + rules)
  let system = buildSystemMessage(langConfig);

  // Append coaching context
  const coachingParts = [];

  if (coaching.grammar_rules.length > 0) {
    coachingParts.push(
      'GRAMMAR RULES (follow strictly):',
      ...coaching.grammar_rules.map(r => `  • ${r}`)
    );
  }

  if (coaching.style_notes) {
    coachingParts.push(
      '',
      `STYLE GUIDE: ${coaching.style_notes}`
    );
  }

  if (coachingParts.length > 0) {
    system += `\n\n--- COACHING CONTEXT ---\n${coachingParts.join('\n')}\n--- END COACHING ---`;
  }

  return system;
}

/**
 * Build a combined coached prompt (legacy interface for backward compat).
 *
 * Used by tests that call buildCoachedPrompt() directly.
 * New code should use buildCoachedSystemMessage() + per-batch user message.
 *
 * @param {Object<string, string>} toTranslate - Key-value map to translate
 * @param {{ name: string, register: string }} langConfig - Target language info
 * @param {import('../types.js').CoachingData} coaching - Coaching data
 * @returns {string} Combined system + user prompt
 */
function buildCoachedPrompt(toTranslate, langConfig, coaching) {
  const system = buildCoachedSystemMessage(langConfig, coaching);

  // Build user message with dictionary hints + UI context + JSON payload
  const dictHints = findDictionaryMatches(toTranslate, coaching.dictionary);
  const typeHints = inferKeyTypes(toTranslate);

  let userMessage = '';
  if (dictHints.length > 0) {
    userMessage += 'REQUIRED TERMINOLOGY (use these exact translations):\n';
    userMessage += dictHints.map(h => `  • "${h.term}" → "${h.translation}"`).join('\n');
    userMessage += '\n\n';
  }
  if (typeHints.length > 0) {
    userMessage += `UI context for these keys:\n${typeHints.join('\n')}\n\n`;
  }
  userMessage += JSON.stringify(toTranslate, null, 2);

  return `${system}\n\n${userMessage}`;
}

/**
 * Build a coaching context block for freeform content translation.
 *
 * Lighter than the key-value version — only grammar and style, no dictionary
 * matching (content is too freeform for term-level matching).
 *
 * @param {import('../types.js').CoachingData} coaching - Coaching data
 * @returns {string} Coaching context block, or empty string if no data
 */
function buildContentCoachingBlock(coaching) {
  const parts = [];

  if (coaching.grammar_rules.length > 0) {
    parts.push(
      'IMPORTANT — Follow these grammar rules:',
      ...coaching.grammar_rules.map(r => `  • ${r}`)
    );
  }

  if (coaching.style_notes) {
    parts.push('', `STYLE GUIDE: ${coaching.style_notes}`);
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * Scan source values for dictionary term matches.
 *
 * Uses case-insensitive word-boundary matching to find terms from the
 * coaching dictionary that appear in the current batch's source values.
 *
 * @param {object} toTranslate - Key-value map to scan
 * @param {object} dictionary - Term → translation map
 * @returns {Array<{ term: string, translation: string }>} Matched hints
 */
function findDictionaryMatches(toTranslate, dictionary) {
  if (!dictionary || Object.keys(dictionary).length === 0) return [];

  const matches = [];
  const seen = new Set();
  const values = Object.values(toTranslate).join(' ').toLowerCase();

  for (const [term, translation] of Object.entries(dictionary)) {
    if (seen.has(term)) continue;

    // Case-insensitive word-boundary check
    // Use a simple indexOf for performance — the dictionary is usually small
    if (values.includes(term.toLowerCase())) {
      matches.push({ term, translation });
      seen.add(term);
    }
  }

  return matches;
}

export {
  LLMCoachedMethod,
  buildCoachedPrompt,
  buildCoachedSystemMessage,
  buildContentCoachingBlock,
  findDictionaryMatches,
  DEFAULT_COACHING_DIR,
};
