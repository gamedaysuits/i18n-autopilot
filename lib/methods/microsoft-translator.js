import { TranslationMethod } from './base.js';
import { getEnvOrFileVar } from '../api-key.js';
import { EST_CHARS_PER_KEY } from '../config.js';
import { fetchWithRetry } from './fetch-with-retry.js';

const MICROSOFT_API_URL = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
const MICROSOFT_REQUEST_TIMEOUT_MS = 15000;

class MicrosoftTranslatorMethod extends TranslationMethod {
  constructor(options = {}) {
    super('microsoft-translator', options);
  }

  // ── API resolution helpers ──────────────────────────────────────

  /**
   * Resolve the Microsoft Translator API key from options, env vars, or .env files.
   * @param {object} options - Caller-provided options
   * @returns {string|null}
   */
  _resolveApiKey(options) {
    return options.microsoftApiKey
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY')
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY', options.cwd);
  }

  /**
   * Resolve the Azure region for the Translator resource.
   * @param {object} options - Caller-provided options
   * @returns {string|null}
   */
  _resolveRegion(options) {
    return options.microsoftRegion
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_REGION')
      || getEnvOrFileVar('MICROSOFT_TRANSLATOR_REGION', options.cwd);
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
    const apiKey = this._resolveApiKey(options);
    const region = this._resolveRegion(options);

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
    const apiKey = this._resolveApiKey(options);
    const region = this._resolveRegion(options);

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

    const url = `${MICROSOFT_API_URL}&from=${sourceLocale}&to=${targetLocale}`;
    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Ocp-Apim-Subscription-Key': apiKey,
    };
    if (region) {
      headers['Ocp-Apim-Subscription-Region'] = region;
    }

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ Text: bodyText }]),
    }, {
      label: 'Microsoft content',
      timeoutMs: MICROSOFT_REQUEST_TIMEOUT_MS * 2,
    });

    if (!response) return null;

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
  }

  estimateCost(keyCount) {
    const estimatedChars = keyCount * EST_CHARS_PER_KEY;
    const costPerChar = 10 / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedChars * costPerChar * 10000) / 10000,
      currency: 'USD',
      source: 'microsoft-translator-pricing',
      note: 'Based on Microsoft Translator API pricing ($10/1M chars). Actual cost depends on string length.',
    };
  }

  checkReadiness(_context) {
    if (!process.env.MICROSOFT_TRANSLATOR_KEY) {
      return { ready: false, reason: 'No Microsoft Translator key (MICROSOFT_TRANSLATOR_KEY).' };
    }
    return { ready: true };
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

  getSetupHelp() {
    const apiKey = process.env.MICROSOFT_TRANSLATOR_API_KEY || process.env.AZURE_TRANSLATOR_KEY;
    if (!apiKey) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Microsoft Translator requires an Azure subscription key.       │',
        '  │                                                                │',
        '  │ 1. Create a Translator resource in Azure Portal                │',
        '  │ 2. Run: export MICROSOFT_TRANSLATOR_API_KEY=...                │',
        '  │ 3. Set region: export MICROSOFT_TRANSLATOR_REGION=eastus        │',
        '  │                                                                │',
        '  │ Docs: https://learn.microsoft.com/azure/cognitive-services/     │',
        '  │       translator/quickstart-text-rest-api                       │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Azure Portal for quota/billing.'];
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
    const url = `${MICROSOFT_API_URL}&from=${sourceLocale}&to=${targetLocale}`;

    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Ocp-Apim-Subscription-Key': apiKey,
    };

    if (region) {
      headers['Ocp-Apim-Subscription-Region'] = region;
    }

    const body = sourceTexts.map(text => ({ Text: text }));

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }, {
      label: `Microsoft Translator batch ${batchNum}`,
      timeoutMs: MICROSOFT_REQUEST_TIMEOUT_MS,
    });

    if (!response) return null;

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
  }
}

export { MicrosoftTranslatorMethod };
