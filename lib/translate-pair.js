/**
 * translate-pair.js — Shared translation pipeline for a single pair
 *
 * Encapsulates the common sequence used by both the standard sync path
 * and the Docusaurus sync path:
 *
 *   1. TM partition: split keys into cached hits and API misses
 *   2. API call: translate the misses via translateBatch
 *   3. TM store: cache new translations for future runs
 *   4. Quality gate: validate translations (hallucination, script, length)
 *
 * Callers get back a structured result and handle their own control flow
 * (fallback decisions, error messages, script conversion, etc.) because
 * those details differ between sync paths.
 */

import { translateBatch } from './translate.js';
import { validateTranslations, logGateFailures } from './validate.js';
import { partitionByTM, storeTM } from './tm.js';
import { output } from './output.js';

/**
 * Translate a set of string keys through the TM + API + quality gate pipeline.
 *
 * @param {string[]} stringKeys - Keys to translate (must be string-valued in sourceFlat)
 * @param {object} sourceFlat - Full flattened source locale map
 * @param {object} pairConfig - Pair configuration (target, method, model, batchSize, etc.)
 * @param {string} pairKey - Human-readable pair identifier for logging (e.g. "en→fr")
 * @param {object} options
 * @param {string} options.apiKey - API key for translation provider
 * @param {object} options.tm - Translation Memory object (mutable — entries are stored in-place)
 * @param {string} options.targetCode - Target language code
 * @param {object} [options.descriptions] - Optional key descriptions (Docusaurus format)
 * @param {Function} [options.onProgress] - Progress callback: (completed, total) => void
 * @returns {Promise<TranslateResult>}
 *
 * @typedef {object} TranslateResult
 * @property {object|null} translated - Validated translations, or null if all failed
 * @property {number} tmHitCount - Number of keys served from TM cache
 * @property {Array} failures - Quality gate failures (for caller logging)
 * @property {boolean} apiCalled - Whether the API was actually invoked
 * @property {boolean} apiReturnedNull - Whether the API was called but returned null
 */
export async function translateAndValidate(stringKeys, sourceFlat, pairConfig, pairKey, options) {
  const { apiKey, tm, targetCode, descriptions } = options;
  const method = pairConfig.method || 'llm';

  // Step 1: TM partition — serve cached hits, identify API misses
  const { hits: tmHits, misses: tmMisses } = partitionByTM(
    tm, sourceFlat, stringKeys, targetCode, method
  );

  const tmHitCount = Object.keys(tmHits).length;
  if (tmHitCount > 0) {
    output.info(`[TM] ${tmHitCount} key(s) served from cache`);
  }

  // Start with TM hits as the base
  let translated = { ...tmHits };
  let apiCalled = false;
  let apiReturnedNull = false;

  // Step 2: API call for misses
  if (tmMisses.length > 0) {
    output.progress(`     Translating ${tmMisses.length} key(s) to ${pairConfig.name} (${method})...`);

    const batchOptions = {
      apiKey,
      model: pairConfig.model,
      batchSize: pairConfig.batchSize,
      onProgress: options.onProgress || null,
    };

    // Docusaurus passes descriptions for disambiguation context
    if (descriptions) {
      batchOptions.descriptions = descriptions;
    }

    const apiResult = await translateBatch(tmMisses, sourceFlat, pairConfig, batchOptions);
    apiCalled = true;

    if (apiResult) {
      Object.assign(translated, apiResult);

      // Step 3: Store new translations in TM for future runs
      for (const [k, v] of Object.entries(apiResult)) {
        if (typeof v === 'string' && typeof sourceFlat[k] === 'string') {
          storeTM(tm, sourceFlat[k], targetCode, method, v);
        }
      }
    } else {
      apiReturnedNull = true;
    }
  }

  // Step 4: Quality gate — validate translations before accepting
  let failures = [];
  if (translated && Object.keys(translated).length > 0) {
    const result = validateTranslations(translated, sourceFlat, pairConfig);
    failures = result.failures;
    if (failures.length > 0) {
      logGateFailures(failures, pairKey);
    }
    translated = Object.keys(result.validated).length > 0 ? result.validated : null;
  } else {
    translated = null;
  }

  return {
    translated,
    tmHitCount,
    failures,
    apiCalled,
    apiReturnedNull,
  };
}
