import { TranslationMethod } from './base.js';
import { getEnvOrFileVar } from '../api-key.js';
import {
  MAX_RETRIES,
  isRetryable,
  getBackoffDelay,
  sleep,
} from './http-utils.js';

const LIBRETRANSLATE_REQUEST_TIMEOUT_MS = 15000;

class LibreTranslateMethod extends TranslationMethod {
  constructor(options = {}) {
    super('libretranslate', options);
  }

  /**
   * Translate a batch of key-value pairs via LibreTranslate API.
   *
   * @param {string[]} keys - Flat dot-notation keys to translate
   * @param {object} sourceFlat - Full flattened source locale
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - { apiKey, batchSize }
   * @returns {object|null} Map of key → translated value, or null
   */
  async translate(keys, sourceFlat, pairConfig, options) {
    const apiEndpoint = options.libretranslateApiUrl
      || getEnvOrFileVar('LIBRETRANSLATE_API_URL')
      || getEnvOrFileVar('LIBRETRANSLATE_API_URL', options.cwd)
      || 'http://localhost:5000/translate';

    const apiKey = options.libretranslateApiKey
      || getEnvOrFileVar('LIBRETRANSLATE_API_KEY')
      || getEnvOrFileVar('LIBRETRANSLATE_API_KEY', options.cwd);

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';
    const allTranslated = {};

    const maxSegments = pairConfig.batchSize || options.batchSize || 64;

    for (let i = 0; i < keys.length; i += maxSegments) {
      const chunk = keys.slice(i, i + maxSegments);
      const orderedKeys = [];
      const sourceTexts = [];

      for (const key of chunk) {
        const val = sourceFlat[key];
        if (val && typeof val === 'string') {
          orderedKeys.push(key);
          sourceTexts.push(val);
        }
      }

      if (sourceTexts.length === 0) continue;

      const batchNum = Math.floor(i / maxSegments) + 1;
      const result = await this._translateBatchWithRetry({
        apiEndpoint,
        apiKey,
        orderedKeys,
        sourceTexts,
        sourceLocale,
        targetLocale,
        batchNum,
      });

      if (result) {
        Object.assign(allTranslated, result);
      }
    }

    return Object.keys(allTranslated).length > 0 ? allTranslated : null;
  }

  /**
   * Translate freeform Markdown content via LibreTranslate API.
   *
   * Same protect/restore approach — ⟦PROTECTED_N⟧ placeholders shield
   * code blocks and shortcodes from the translation engine.
   *
   * @param {string} prompt - Complete translation prompt from buildContentPrompt()
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - {}
   * @returns {string|null} Translated text, or null on failure
   */
  async translateContent(prompt, pairConfig, options) {
    const apiEndpoint = options.libretranslateApiUrl
      || getEnvOrFileVar('LIBRETRANSLATE_API_URL')
      || getEnvOrFileVar('LIBRETRANSLATE_API_URL', options.cwd)
      || 'http://localhost:5000/translate';

    const apiKey = options.libretranslateApiKey
      || getEnvOrFileVar('LIBRETRANSLATE_API_KEY')
      || getEnvOrFileVar('LIBRETRANSLATE_API_KEY', options.cwd);

    // Extract the Markdown body from the translation prompt
    const separator = '\n---\n';
    const sepIdx = prompt.indexOf(separator);
    const bodyText = sepIdx !== -1 ? prompt.slice(sepIdx + separator.length) : prompt;
    if (!bodyText.trim()) return null;

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LIBRETRANSLATE_REQUEST_TIMEOUT_MS * 2);

        const body = {
          q: bodyText,
          source: sourceLocale,
          target: targetLocale,
          format: 'text',
        };
        if (apiKey) {
          body.api_key = apiKey;
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isRetryable(response.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.error(`\n     ⏳ LibreTranslate content: ${response.status} — retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
          console.error(`\n     [ERR] LibreTranslate content: ${response.status} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`\n     [ERR] LibreTranslate content: ${response.status} — ${errorBody}`);
          return null;
        }

        const json = await response.json();
        if (!json?.translatedText) {
          console.error('\n     [ERR] LibreTranslate content: empty response');
          return null;
        }

        return json.translatedText;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.error('\n     ⏳ LibreTranslate content: Timeout — retrying...');
        } else if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.error(`\n     ⏳ LibreTranslate content: ${err.message} — retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        } else {
          console.error(`\n     [ERR] LibreTranslate content: ${err.message} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }
      }
    }
    return null;
  }

  estimateCost(keyCount) {
    return {
      estimatedCost: 0,
      currency: 'USD',
      source: 'libretranslate-pricing',
      note: 'LibreTranslate is free and self-hosted.',
    };
  }

  getQualityTier() {
    return 'standard';
  }

  getProvenance() {
    return {
      resources: [
        {
          name: 'LibreTranslate API',
          license: 'AGPL-3.0 (Self-hosted)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }

  async _translateBatchWithRetry({
    apiEndpoint,
    apiKey,
    orderedKeys,
    sourceTexts,
    sourceLocale,
    targetLocale,
    batchNum,
  }) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LIBRETRANSLATE_REQUEST_TIMEOUT_MS);

        const body = {
          q: sourceTexts,
          source: sourceLocale,
          target: targetLocale,
          format: 'text',
        };

        if (apiKey) {
          body.api_key = apiKey;
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isRetryable(response.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.error(`\n     ⏳ LibreTranslate batch ${batchNum}: ${response.status} — retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
          console.error(`\n     [ERR] LibreTranslate batch ${batchNum}: ${response.status} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`\n     [ERR] LibreTranslate batch ${batchNum}: ${response.status} — ${errorBody}`);
          return null;
        }

        const json = await response.json();
        const translatedText = json?.translatedText;

        if (!translatedText || (Array.isArray(translatedText) && translatedText.length !== orderedKeys.length)) {
          console.error(`\n     [ERR] LibreTranslate batch ${batchNum}: Response format or length mismatch`);
          return null;
        }

        const result = {};
        if (Array.isArray(translatedText)) {
          for (let i = 0; i < orderedKeys.length; i++) {
            result[orderedKeys[i]] = translatedText[i];
          }
        } else if (orderedKeys.length === 1 && typeof translatedText === 'string') {
          // If LibreTranslate returned a single string for a single item batch
          result[orderedKeys[0]] = translatedText;
        } else {
          console.error(`\n     [ERR] LibreTranslate batch ${batchNum}: Unexpected translatedText format`);
          return null;
        }

        const charCount = sourceTexts.reduce((sum, t) => sum + t.length, 0);
        process.stdout.write(`  ✓ LibreTranslate batch ${batchNum} (${orderedKeys.length} keys, ${charCount} chars)`);

        return result;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.error(`\n     ⏳ LibreTranslate batch ${batchNum}: Timeout — retrying...`);
        } else if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.error(`\n     ⏳ LibreTranslate batch ${batchNum}: ${err.message} — retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        } else {
          console.error(`\n     [ERR] LibreTranslate batch ${batchNum}: ${err.message} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }
      }
    }
    return null;
  }
}

export { LibreTranslateMethod };
