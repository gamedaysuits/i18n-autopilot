import { TranslationMethod } from './base.js';
import { getEnvOrFileVar } from '../api-key.js';
import {
  MAX_RETRIES,
  isRetryable,
  getBackoffDelay,
  sleep,
} from './http-utils.js';

const MICROSOFT_API_URL = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
const MICROSOFT_REQUEST_TIMEOUT_MS = 15000;

class MicrosoftTranslatorMethod extends TranslationMethod {
  constructor(options = {}) {
    super('microsoft-translator', options);
  }

  /**
   * Translate a batch of key-value pairs via Microsoft Translator API.
   *
   * @param {string[]} keys - Flat dot-notation keys to translate
   * @param {object} sourceFlat - Full flattened source locale
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - { apiKey, batchSize }
   * @returns {object|null} Map of key → translated value, or null
   */
  async translate(keys, sourceFlat, pairConfig, options) {
    const apiKey = options.microsoftApiKey
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY')
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY', options.cwd);

    const region = options.microsoftRegion
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_REGION')
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_REGION', options.cwd);

    if (!apiKey) {
      console.error('     [WARN] Microsoft Translator: no API key — skipping.');
      return null;
    }

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';
    const allTranslated = {};

    // Microsoft supports up to 100 segments per request
    const maxSegments = pairConfig.batchSize || options.batchSize || 100;

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
        apiKey,
        region,
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
   * Translate freeform Markdown content via Microsoft Translator API.
   *
   * Same protect/restore approach — ⟦PROTECTED_N⟧ placeholders shield
   * code blocks and shortcodes from the translation engine.
   *
   * @param {string} prompt - Complete translation prompt from buildContentPrompt()
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - { apiKey }
   * @returns {string|null} Translated text, or null on failure
   */
  async translateContent(prompt, pairConfig, options) {
    const apiKey = options.microsoftApiKey
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY')
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY', options.cwd);

    const region = options.microsoftRegion
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_REGION')
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_REGION', options.cwd);

    if (!apiKey) {
      console.error('     [WARN] Microsoft Translator: no API key — skipping.');
      return null;
    }

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
        const timeoutId = setTimeout(() => controller.abort(), MICROSOFT_REQUEST_TIMEOUT_MS * 2);

        const url = `${MICROSOFT_API_URL}&from=${sourceLocale}&to=${targetLocale}`;
        const headers = {
          'Content-Type': 'application/json; charset=UTF-8',
          'Ocp-Apim-Subscription-Key': apiKey,
        };
        if (region) {
          headers['Ocp-Apim-Subscription-Region'] = region;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify([{ Text: bodyText }]),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isRetryable(response.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.error(`\n     ⏳ Microsoft content: ${response.status} — retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
          console.error(`\n     [ERR] Microsoft content: ${response.status} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`\n     [ERR] Microsoft content: ${response.status} — ${errorBody}`);
          return null;
        }

        const json = await response.json();
        if (!json || json.length === 0 || !json[0].translations?.[0]?.text) {
          console.error('\n     [ERR] Microsoft content: empty response');
          return null;
        }

        return json[0].translations[0].text;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.error('\n     ⏳ Microsoft content: Timeout — retrying...');
        } else if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.error(`\n     ⏳ Microsoft content: ${err.message} — retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        } else {
          console.error(`\n     [ERR] Microsoft content: ${err.message} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }
      }
    }
    return null;
  }

  estimateCost(keyCount) {
    const estimatedChars = keyCount * 25;
    const costPerChar = 10 / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedChars * costPerChar * 10000) / 10000,
      currency: 'USD',
      source: 'microsoft-translator-pricing',
      note: 'Based on Microsoft Translator API pricing ($10/1M chars). Actual cost depends on string length.',
    };
  }

  getQualityTier() {
    return 'standard';
  }

  getProvenance() {
    return {
      resources: [
        {
          name: 'Microsoft Translator API',
          license: 'Proprietary (Microsoft ToS)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }

  async _translateBatchWithRetry({
    apiKey,
    region,
    orderedKeys,
    sourceTexts,
    sourceLocale,
    targetLocale,
    batchNum,
  }) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MICROSOFT_REQUEST_TIMEOUT_MS);

        const url = `${MICROSOFT_API_URL}&from=${sourceLocale}&to=${targetLocale}`;

        const headers = {
          'Content-Type': 'application/json; charset=UTF-8',
          'Ocp-Apim-Subscription-Key': apiKey,
        };

        if (region) {
          headers['Ocp-Apim-Subscription-Region'] = region;
        }

        const body = sourceTexts.map(text => ({ Text: text }));

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isRetryable(response.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.error(`\n     ⏳ Microsoft Translator batch ${batchNum}: ${response.status} — retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
          console.error(`\n     [ERR] Microsoft Translator batch ${batchNum}: ${response.status} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`\n     [ERR] Microsoft Translator batch ${batchNum}: ${response.status} — ${errorBody}`);
          return null;
        }

        const json = await response.json();

        if (!json || json.length !== orderedKeys.length) {
          console.error(`\n     [ERR] Microsoft Translator batch ${batchNum}: Response length mismatch (expected ${orderedKeys.length}, got ${json?.length || 0})`);
          return null;
        }

        const result = {};
        for (let i = 0; i < orderedKeys.length; i++) {
          result[orderedKeys[i]] = json[i].translations[0].text;
        }

        const charCount = sourceTexts.reduce((sum, t) => sum + t.length, 0);
        process.stdout.write(`  ✓ Microsoft batch ${batchNum} (${orderedKeys.length} keys, ${charCount} chars)`);

        return result;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.error(`\n     ⏳ Microsoft Translator batch ${batchNum}: Timeout — retrying...`);
        } else if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.error(`\n     ⏳ Microsoft Translator batch ${batchNum}: ${err.message} — retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        } else {
          console.error(`\n     [ERR] Microsoft Translator batch ${batchNum}: ${err.message} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }
      }
    }
    return null;
  }
}

export { MicrosoftTranslatorMethod };
