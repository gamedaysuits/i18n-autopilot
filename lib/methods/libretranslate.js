import { TranslationMethod } from './base.js';
import { getEnvOrFileVar } from '../api-key.js';
import { fetchWithRetry } from './fetch-with-retry.js';
import { pMap } from '../concurrent.js';

const LIBRETRANSLATE_REQUEST_TIMEOUT_MS = 15000;

class LibreTranslateMethod extends TranslationMethod {
  constructor(options = {}) {
    super('libretranslate', options);
  }

  // ── API resolution helpers ──────────────────────────────────────

  /**
   * Resolve the LibreTranslate API endpoint URL.
   * Falls back to localhost:5000 for self-hosted instances.
   * @param {object} options - Caller-provided options
   * @returns {string}
   */
  _resolveApiEndpoint(options) {
    return options.libretranslateApiUrl
      || getEnvOrFileVar('LIBRETRANSLATE_API_URL')
      || getEnvOrFileVar('LIBRETRANSLATE_API_URL', options.cwd)
      || 'http://localhost:5000/translate';
  }

  /**
   * Resolve the LibreTranslate API key (optional for self-hosted).
   * @param {object} options - Caller-provided options
   * @returns {string|null}
   */
  _resolveApiKey(options) {
    return options.libretranslateApiKey
      || getEnvOrFileVar('LIBRETRANSLATE_API_KEY')
      || getEnvOrFileVar('LIBRETRANSLATE_API_KEY', options.cwd);
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
    const apiEndpoint = this._resolveApiEndpoint(options);
    const apiKey = this._resolveApiKey(options);

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';
    const allTranslated = {};

    const maxSegments = pairConfig.batchSize || options.batchSize || 64;

    const batchChunks = [];
    for (let i = 0; i < keys.length; i += maxSegments) {
      batchChunks.push(keys.slice(i, i + maxSegments));
    }

    await pMap(batchChunks, async (chunk, idx) => {
      const orderedKeys = [];
      const sourceTexts = [];

      for (const key of chunk) {
        const val = sourceFlat[key];
        if (val && typeof val === 'string') {
          orderedKeys.push(key);
          sourceTexts.push(val);
        }
      }

      if (sourceTexts.length === 0) return;

      const result = await this._translateBatchWithRetry({
        apiEndpoint,
        apiKey,
        orderedKeys,
        sourceTexts,
        sourceLocale,
        targetLocale,
        batchNum: idx + 1,
      });

      if (result) {
        Object.assign(allTranslated, result);
      }
    }, { concurrency: 4 });

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
    const apiEndpoint = this._resolveApiEndpoint(options);
    const apiKey = this._resolveApiKey(options);

    // Extract the Markdown body from the translation prompt
    const separator = '\n---\n';
    const sepIdx = prompt.indexOf(separator);
    const bodyText = sepIdx !== -1 ? prompt.slice(sepIdx + separator.length) : prompt;
    if (!bodyText.trim()) return null;

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';

    const body = {
      q: bodyText,
      source: sourceLocale,
      target: targetLocale,
      format: 'text',
    };
    if (apiKey) {
      body.api_key = apiKey;
    }

    const response = await fetchWithRetry(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, {
      label: 'LibreTranslate content',
      timeoutMs: LIBRETRANSLATE_REQUEST_TIMEOUT_MS * 2,
    });

    if (!response) return null;

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

  getSetupHelp() {
    // LibreTranslate is self-hosted — there's no "missing key" case,
    // just a "can't connect" case. Always show the connection guide.
    return [
      '',
      '  ┌─ LibreTranslate Connection Failed ──────────────────────────────┐',
      '  │ Could not connect to LibreTranslate API.                         │',
      '  │                                                                  │',
      '  │ Default endpoint: http://localhost:5000/translate                 │',
      '  │                                                                  │',
      '  │ To use a remote instance:                                        │',
      '  │   export LIBRETRANSLATE_API_URL=https://your-instance/translate   │',
      '  │   export LIBRETRANSLATE_API_KEY=... (if required)                 │',
      '  │                                                                  │',
      '  │ Self-host: docker run -p 5000:5000 libretranslate/libretranslate  │',
      '  └──────────────────────────────────────────────────────────────────┘',
    ];
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
    const body = {
      q: sourceTexts,
      source: sourceLocale,
      target: targetLocale,
      format: 'text',
    };

    if (apiKey) {
      body.api_key = apiKey;
    }

    const response = await fetchWithRetry(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, {
      label: `LibreTranslate batch ${batchNum}`,
      timeoutMs: LIBRETRANSLATE_REQUEST_TIMEOUT_MS,
    });

    if (!response) return null;

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
  }
}

export { LibreTranslateMethod };
