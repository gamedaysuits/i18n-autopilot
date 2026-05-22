/**
 * LLM Translation Method — direct LLM prompting via OpenRouter.
 *
 * This is the default translation method and the foundation all other
 * methods build on. It extracts the existing translateBatch/translateRawContent
 * logic from the v2 translate.js into a proper method class.
 *
 * HOW IT WORKS:
 *   1. Receives keys + source values from the orchestrator
 *   2. Chunks them into batches (default 30 keys per batch)
 *   3. Builds a register-steered prompt per batch
 *   4. Sends to OpenRouter with exponential backoff retry
 *   5. Validates response (only accept keys we sent, block prototype pollution)
 *   6. Returns merged results
 *
 * PROMPT CACHING:
 *   The prompt is split into two parts:
 *     - system message: register, rules, UI context (identical across batches)
 *     - user message: JSON payload (varies per batch)
 *   This enables provider-level prompt caching (Anthropic, Gemini) on the
 *   system preamble, reducing token costs by 30-50% for large syncs.
 *
 * RETRY CASCADE:
 *   On JSON parse failure (malformed model output), the cascade retries:
 *     1. Full batch (original size)
 *     2. Half-batches (split in two, retry each half)
 *     3. Individual keys (batchSize=1)
 *   Each level is tried before escalating to the next. A maxRetries budget
 *   cap prevents infinite token spend.
 *
 * COST PROFILE: ~$0.01 per 1k keys at GPT-4o-mini pricing.
 * QUALITY TIER: standard — no post-processing or verification.
 */

import { TranslationMethod } from './base.js';
import { REQUEST_TIMEOUT_MS } from './http-utils.js';
import { callOpenRouter, callOpenRouterJSON } from './openrouter-client.js';
import { estimateOpenRouterCost } from './openrouter-pricing.js';
import { DEFAULT_MODEL, DEFAULT_BATCH_SIZE } from '../config.js';

/**
 * Keys that could trigger prototype pollution if accepted from LLM output.
 * Blocked in response validation as a defense-in-depth measure.
 */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Check if a key path contains any unsafe segments */
function isUnsafeKey(key) {
  return key.split('.').some(segment => UNSAFE_KEYS.has(segment));
}

class LLMMethod extends TranslationMethod {
  constructor(options = {}) {
    super('llm', options);
  }

  /**
   * Translate a batch of key-value pairs via OpenRouter.
   *
   * @param {string[]} keys - Flat dot-notation keys to translate
   * @param {object} sourceFlat - Full flattened source locale
   * @param {object} pairConfig - Pair config (method, model, register, name, etc.)
   * @param {object} options - { apiKey, batchSize }
   * @returns {object|null} Map of key → translated value, or null if all failed
   */
  async translate(keys, sourceFlat, pairConfig, options) {
    const { apiKey } = options;
    const batchSize = pairConfig.batchSize || options.batchSize || DEFAULT_BATCH_SIZE;
    const model = pairConfig.model || options.model || DEFAULT_MODEL;
    const maxRetries = pairConfig.maxRetries ?? 3;
    if (!apiKey) {
      console.error('     [WARN] LLM translate: no API key provided — skipping batch.');
      return null;
    }

    const langConfig = {
      name: pairConfig.name,
      register: pairConfig.register,
    };

    // Build the system message once — identical across all batches for this locale.
    // This enables provider-level prompt caching (Anthropic, Gemini).
    const systemMessage = buildSystemMessage(langConfig);

    const allTranslated = {};

    for (let i = 0; i < keys.length; i += batchSize) {
      const chunk = keys.slice(i, i + batchSize);
      const toTranslate = {};
      for (const key of chunk) {
        toTranslate[key] = sourceFlat[key];
      }

      const batchNum = Math.floor(i / batchSize) + 1;
      const result = await this._translateWithCascade(toTranslate, langConfig, {
        apiKey,
        model,
        batchNum,
        maxRetries,
        systemMessage,
      }, this._callOpenRouterBatch.bind(this));

      if (result) {
        Object.assign(allTranslated, result);
      }
    }

    return Object.keys(allTranslated).length > 0 ? allTranslated : null;
  }

  /**
   * Translate freeform content (Markdown body, etc.) via OpenRouter.
   *
   * @param {string} prompt - Complete translation prompt
   * @param {object} pairConfig - Pair config
   * @param {object} options - { apiKey }
   * @returns {string|null} Translated text, or null on failure
   */
  async translateContent(prompt, pairConfig, options) {
    const { apiKey } = options;
    const model = pairConfig.model || options.model || DEFAULT_MODEL;
    if (!apiKey) {
      console.error('     [WARN] LLM translateContent: no API key provided — skipping.');
      return null;
    }

    // Content translation can produce longer output — allow 2x timeout
    return callOpenRouter({
      prompt,
      apiKey,
      model,
      temperature: 0.3,
      timeoutMs: REQUEST_TIMEOUT_MS * 2,
      label: 'Content',
    });
  }

  /**
   * Cost estimation — fetches live per-token pricing from OpenRouter.
   *
   * The pricing module fetches once per process and caches.
   * Falls back to 'unknown' if offline or the model isn't found.
   *
   * @param {number} keyCount - Number of keys to translate
   * @param {object} [pairConfig] - Pair config containing the model ID
   */
  async estimateCost(keyCount, pairConfig = {}) {
    const model = pairConfig.model || DEFAULT_MODEL;
    return estimateOpenRouterCost(keyCount, model, { coached: false });
  }

  getQualityTier() {
    return 'standard';
  }

  getProvenance() {
    return {
      resources: [],
      commercialReady: true,
      flags: [],
    };
  }

  // -----------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------

  /**
   * Retry cascade for a single batch.
   *
   * On JSON parse failure (model returned garbage), the cascade:
   *   1. Retries the full batch once
   *   2. Splits into two half-batches and retries each
   *   3. Falls back to individual key translation (batchSize=1)
   *
   * The maxRetries budget limits total cascade depth to prevent
   * infinite token spend on a language the model genuinely can't handle.
   *
   * This method is also used by LLMCoachedMethod via composition — the
   * coached method passes its own batch function that injects dictionary
   * hints into the prompt.
   *
   * @param {object} toTranslate - Key-value map to translate
   * @param {object} langConfig - { name, register }
   * @param {object} options - { apiKey, model, batchNum, maxRetries, systemMessage }
   * @param {Function} batchFn - (toTranslate, options) => Promise<result>
   *   The function that makes a single batch API call.
   * @param {string} label - Prefix for log messages (e.g., '' or 'Coached ')
   * @returns {object|null} Validated key-value map, or null
   */
  async _translateWithCascade(toTranslate, langConfig, options, batchFn, label = '') {
    const { maxRetries } = options;
    let retriesUsed = 0;

    // Attempt 1: Full batch
    const result = await batchFn(toTranslate, options);

    // Success — return the result
    if (result && !result._parseError) return result;

    // API failure (null) — nothing to retry with smaller batches
    if (!result) return null;

    // Parse error — start the cascade
    retriesUsed++;
    if (retriesUsed > maxRetries) {
      this._logCascadeExhausted(toTranslate, options, label);
      return null;
    }

    const keys = Object.keys(toTranslate);

    // Attempt 2: Half-batches (only if batch has >1 key)
    if (keys.length > 1) {
      const mid = Math.ceil(keys.length / 2);
      const firstHalf = {};
      const secondHalf = {};
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (i < mid) firstHalf[key] = toTranslate[key];
        else secondHalf[key] = toTranslate[key];
      }

      console.error(`\n     ⟳ ${label}Batch ${options.batchNum}: parse error — splitting ${keys.length} keys into halves (${Object.keys(firstHalf).length} + ${Object.keys(secondHalf).length})...`);

      const merged = {};
      for (const half of [firstHalf, secondHalf]) {
        retriesUsed++;
        if (retriesUsed > maxRetries) {
          this._logCascadeExhausted(half, options, label);
          break;
        }

        const halfResult = await batchFn(half, options);

        if (halfResult && !halfResult._parseError) {
          Object.assign(merged, halfResult);
        } else if (halfResult?._parseError) {
          // Half-batch also failed — try individual keys
          console.error(`     ⟳ ${label}Half-batch parse error — falling back to individual keys...`);
          for (const [key, value] of Object.entries(half)) {
            retriesUsed++;
            if (retriesUsed > maxRetries) {
              console.error(`     [ERR] ${label}Retry budget exhausted (${maxRetries}). Skipping remaining keys.`);
              if (!label) {
                console.error(`           Consider: "pairs": { "${options.pairKey || 'en:' + key.split('.')[0]}": { "model": "google/gemini-3.1-pro-thinking", "batchSize": 5 } }`);
              }
              break;
            }

            const singleResult = await batchFn({ [key]: value }, options);
            if (singleResult && !singleResult._parseError) {
              Object.assign(merged, singleResult);
            } else {
              console.error(`     [ERR] Key "${key}" failed even as individual ${label.toLowerCase().trim() || 'LLM'} translation.`);
            }
          }
        }
        // halfResult === null (API failure) — skip this half, nothing to retry
      }

      return Object.keys(merged).length > 0 ? merged : null;
    }

    // Single key that failed to parse — one more try
    retriesUsed++;
    if (retriesUsed > maxRetries) {
      this._logCascadeExhausted(toTranslate, options, label);
      return null;
    }

    const retryResult = await batchFn(toTranslate, options);
    if (retryResult && !retryResult._parseError) return retryResult;

    this._logCascadeExhausted(toTranslate, options, label);
    return null;
  }

  /**
   * Make a single OpenRouter batch call.
   * Builds the user message (JSON payload) and delegates to openrouter-client.
   */
  async _callOpenRouterBatch(toTranslate, options) {
    const { apiKey, model, batchNum, systemMessage } = options;
    const userMessage = buildUserMessage(toTranslate);

    return callOpenRouterJSON({
      prompt: userMessage,
      systemMessage,
      apiKey,
      model,
      temperature: 0.3,
      label: `Batch ${batchNum}`,
      expectedKeys: new Set(Object.keys(toTranslate)),
      isUnsafeKey,
    });
  }

  /**
   * Log cascade exhaustion with actionable guidance.
   *
   * @param {object} toTranslate - The keys that failed
   * @param {object} options - { batchNum, maxRetries }
   * @param {string} label - Prefix for log messages (e.g., 'Coached ')
   */
  _logCascadeExhausted(toTranslate, options, label = '') {
    const keys = Object.keys(toTranslate);
    console.error(`\n     [ERR] ${label}Batch ${options.batchNum}: retry cascade exhausted (${options.maxRetries} max).`);
    console.error(`           ${keys.length} key(s) could not be translated.`);
    if (!label) {
      console.error(`           Consider increasing maxRetries or using a more capable model:`);
      console.error(`           "languages": { "<code>": { "model": "google/gemini-3.1-pro-thinking", "batchSize": 5, "maxRetries": 5 } }`);
    }
  }
}

// -----------------------------------------------------------------
// Prompt building — split into system (cached) + user (per-batch)
// -----------------------------------------------------------------

/**
 * Build the system message preamble (cached across batches).
 *
 * Contains: role definition, register, translation rules.
 * This is identical for every batch targeting the same locale,
 * so providers cache it automatically after the first batch.
 *
 * @param {object} langConfig - { name, register }
 * @returns {string} System message
 */
function buildSystemMessage(langConfig) {
  return `You are translating UI strings for a web/mobile application from English to ${langConfig.name}.

Register/tone: ${langConfig.register}

Rules:
- Translate ONLY the values, keep the keys exactly as-is.
- Proper nouns (product names, company names, place names) should NOT be translated.
- Technical terms and role descriptions that are industry-standard should stay in English.
- When gender is ambiguous, prefer gender-neutral forms or the most inclusive option available in ${langConfig.name}.
- Respect the UI element type: button labels should be concise, descriptions can be natural-length, error messages should be clear and direct.
- Return ONLY valid JSON, no markdown fences, no explanation.`;
}

/**
 * Build the user message (varies per batch).
 *
 * Contains: UI context hints for key names + the JSON payload.
 * This changes with every batch, so it's never cached.
 *
 * @param {object} toTranslate - Key-value map to translate
 * @returns {string} User message
 */
function buildUserMessage(toTranslate) {
  const typeHints = inferKeyTypes(toTranslate);
  const hintsBlock = typeHints.length > 0
    ? `UI context for these keys:\n${typeHints.join('\n')}\n\n`
    : '';

  return `${hintsBlock}${JSON.stringify(toTranslate, null, 2)}`;
}

/**
 * Build a combined prompt (legacy interface for backward compat).
 *
 * Used by tests and any code that calls buildPrompt() directly.
 * New code should use buildSystemMessage() + buildUserMessage() separately.
 */
function buildPrompt(toTranslate, langConfig) {
  return `${buildSystemMessage(langConfig)}\n\n${buildUserMessage(toTranslate)}`;
}

/**
 * Infer UI element types from key naming patterns.
 */
const KEY_TYPE_PATTERNS = [
  { pattern: /(?:^|\.)(?:.*(?:btn|button|cta|action|submit|cancel|confirm|dismiss))/i, type: 'button label — keep concise' },
  { pattern: /(?:^|\.)(?:.*(?:title|heading|h[1-6]))/i, type: 'heading/title' },
  { pattern: /(?:^|\.)(?:.*(?:description|desc|subtitle|summary|body|paragraph))/i, type: 'description text — natural length OK' },
  { pattern: /(?:^|\.)(?:.*(?:error|warning|validation|alert))/i, type: 'error/status message — be clear and direct' },
  { pattern: /(?:^|\.)(?:.*(?:placeholder|hint))/i, type: 'input placeholder — keep very short' },
  { pattern: /(?:^|\.)(?:.*(?:label|field))/i, type: 'form label' },
  { pattern: /(?:^|\.)(?:.*(?:tooltip|popover|help))/i, type: 'tooltip/help text' },
  { pattern: /(?:^|\.)(?:.*(?:toast|notification|snackbar))/i, type: 'notification message' },
  { pattern: /(?:^|\.)(?:.*(?:nav|menu|tab|breadcrumb|link))/i, type: 'navigation element — keep concise' },
  { pattern: /(?:^|\.)(?:.*(?:modal|dialog))/i, type: 'dialog/modal text' },
];

function inferKeyTypes(toTranslate) {
  const hints = [];
  for (const key of Object.keys(toTranslate)) {
    for (const { pattern, type } of KEY_TYPE_PATTERNS) {
      if (pattern.test(key)) {
        hints.push(`- "${key}": ${type}`);
        break;
      }
    }
  }
  return hints;
}

export { LLMMethod, buildPrompt, buildSystemMessage, buildUserMessage, isUnsafeKey, inferKeyTypes };
