/**
 * Google Translate Method — Google Cloud Translation API v2.
 *
 * The universal baseline. Works out of the box with just a Google API key.
 * Zero prompt engineering, zero coaching data — pure neural MT. This gives
 * rosetta a free/cheap option that supports 130+ languages.
 *
 * HOW IT WORKS:
 *   1. Reads GOOGLE_TRANSLATE_API_KEY from environment
 *   2. Chunks keys into batches (max 128 segments per Google API call)
 *   3. POSTs to Google Cloud Translation API v2 REST endpoint
 *   4. Maps Google's response array back to rosetta's key-value format
 *   5. Returns translations
 *
 * WHY BUILT-IN (not a plugin):
 *   Google Translate is the universal i18n baseline. Every developer
 *   expects it. It should work with zero config — just an env var.
 *   No plugin install, no method manifest, no coaching data.
 *
 * COST PROFILE: ~$20 per 1M characters (Google's pricing)
 * QUALITY TIER: standard — no post-processing or verification
 *
 * ZERO DEPENDENCIES: Uses Node.js built-in fetch() against the REST API.
 */

import { TranslationMethod } from './base.js';
import { getEnvOrFileVar } from '../api-key.js';
import { EST_CHARS_PER_KEY } from '../config.js';
import { fetchWithRetry } from './fetch-with-retry.js';

const GOOGLE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Google's batch limit per request
const MAX_SEGMENTS_PER_REQUEST = 128;

// Google Translate responses are fast — use a shorter timeout than the default
const GOOGLE_REQUEST_TIMEOUT_MS = 15000;

class GoogleTranslateMethod extends TranslationMethod {
  constructor(options = {}) {
    super('google-translate', options);
  }

  // ── API resolution helpers ──────────────────────────────────────

  /**
   * Resolve the Google Cloud Translation API key.
   * Checks: options.googleApiKey, then GOOGLE_TRANSLATE_API_KEY,
   * then GOOGLE_API_KEY (in env and .env files).
   * @param {object} options - Caller-provided options
   * @returns {string|null}
   */
  _resolveApiKey(options) {
    return options.googleApiKey
      || getEnvOrFileVar('GOOGLE_TRANSLATE_API_KEY')
      || getEnvOrFileVar('GOOGLE_TRANSLATE_API_KEY', options.cwd)
      || getEnvOrFileVar('GOOGLE_API_KEY')
      || getEnvOrFileVar('GOOGLE_API_KEY', options.cwd);
  }

  /**
   * Translate a batch of key-value pairs via Google Cloud Translation API.
   *
   * @param {string[]} keys - Flat dot-notation keys to translate
   * @param {object} sourceFlat - Full flattened source locale
   * @param {import('../types.js').PairConfig} pairConfig - Pair config (target, source, etc.)
   * @param {object} options - { googleApiKey } or reads from env
   * @returns {object|null} Map of key → translated value, or null
   */
  async translate(keys, sourceFlat, pairConfig, options) {
    const apiKey = this._resolveApiKey(options);

    if (!apiKey) {
      console.error('\n     [ERR] Google Translate: No API key found.');
      console.error('        Set GOOGLE_TRANSLATE_API_KEY in your environment.');
      return null;
    }

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';
    const allTranslated = {};

    // Chunk keys into batches of MAX_SEGMENTS_PER_REQUEST
    for (let i = 0; i < keys.length; i += MAX_SEGMENTS_PER_REQUEST) {
      const chunk = keys.slice(i, i + MAX_SEGMENTS_PER_REQUEST);

      // Build parallel arrays: ordered keys and their source values
      const orderedKeys = [];
      const sourceTexts = [];
      for (const key of chunk) {
        const value = sourceFlat[key];
        if (value && typeof value === 'string') {
          orderedKeys.push(key);
          sourceTexts.push(value);
        }
      }

      if (sourceTexts.length === 0) continue;

      const batchNum = Math.floor(i / MAX_SEGMENTS_PER_REQUEST) + 1;
      const result = await this._translateBatchWithRetry(
        orderedKeys,
        sourceTexts,
        sourceLocale,
        targetLocale,
        apiKey,
        batchNum,
      );

      if (result) {
        Object.assign(allTranslated, result);
      }
    }

    return Object.keys(allTranslated).length > 0 ? allTranslated : null;
  }

  /**
   * Translate freeform Markdown content via Google Cloud Translation API.
   *
   * HOW: The caller (content.js) has already run protectBlocks() on the
   * Markdown body, replacing code blocks, shortcodes, inline code, and
   * HTML with ⟦PROTECTED_N⟧ placeholders. We send the protected text
   * through Google Translate as a single string. GT's neural engine
   * treats the Unicode sentinels as opaque tokens and passes them through.
   *
   * SAFETY NET: If GT mangles any placeholders (rare, but possible),
   * the caller's hasOrphanedPlaceholders() check catches the corruption
   * and falls back to the English body with a warning.
   *
   * @param {string} prompt - Complete translation prompt from buildContentPrompt()
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - { googleApiKey }
   * @returns {string|null} Translated text, or null on failure
   */
  async translateContent(prompt, pairConfig, options) {
    const apiKey = this._resolveApiKey(options);

    if (!apiKey) {
      console.error('\n     [ERR] Google Translate: No API key found for content translation.');
      console.error('        Set GOOGLE_TRANSLATE_API_KEY in your environment.');
      return null;
    }

    // Extract the Markdown body from the translation prompt.
    // The prompt format (from content.js buildContentPrompt) ends with:
    //   ---\n<markdown body>
    const separator = '\n---\n';
    const sepIdx = prompt.indexOf(separator);
    const bodyText = sepIdx !== -1 ? prompt.slice(sepIdx + separator.length) : prompt;

    if (!bodyText.trim()) return null;

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';

    return this._translateSingleText(bodyText, sourceLocale, targetLocale, apiKey);
  }

  /**
   * Translate a single text string via Google Cloud Translation API v2.
   *
   * Simpler variant of _translateBatchWithRetry — sends one string,
   * returns one translated string. Used for content translation.
   *
   * @param {string} text - Text to translate
   * @param {string} sourceLocale - Source language code
   * @param {string} targetLocale - Target language code
   * @param {string} apiKey - Google Cloud API key
   * @returns {string|null} Translated text, or null on failure
   */
  async _translateSingleText(text, sourceLocale, targetLocale, apiKey) {
    const response = await fetchWithRetry(GOOGLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        q: [text],
        source: normalizeLocaleForGoogle(sourceLocale),
        target: normalizeLocaleForGoogle(targetLocale),
        format: 'text',
      }),
    }, {
      label: 'Google Translate content',
      timeoutMs: GOOGLE_REQUEST_TIMEOUT_MS * 2,
    });

    if (!response) return null;

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`\n     [ERR] Google Translate content: ${response.status} — ${errorBody}`);
      return null;
    }

    const json = await response.json();
    const translations = json?.data?.translations;

    if (!translations || translations.length === 0) {
      console.error('\n     [ERR] Google Translate content: empty response');
      return null;
    }

    return translations[0].translatedText;
  }

  /**
   * Call Google Cloud Translation API v2 with retry.
   *
   * @param {string[]} orderedKeys - Keys in the same order as sourceTexts
   * @param {string[]} sourceTexts - Source values to translate
   * @param {string} sourceLocale - Source language code
   * @param {string} targetLocale - Target language code
   * @param {string} apiKey - Google Cloud API key
   * @param {number} batchNum - Batch number for logging
   * @returns {object|null} Map of key → translated value
   */
  async _translateBatchWithRetry(orderedKeys, sourceTexts, sourceLocale, targetLocale, apiKey, batchNum) {
    const response = await fetchWithRetry(GOOGLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // API key sent via header (not query string) to avoid leaking in logs/proxies
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        q: sourceTexts,
        source: normalizeLocaleForGoogle(sourceLocale),
        target: normalizeLocaleForGoogle(targetLocale),
        format: 'text',
      }),
    }, {
      label: `Google batch ${batchNum}`,
      timeoutMs: GOOGLE_REQUEST_TIMEOUT_MS,
    });

    if (!response) return null;

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`\n     [ERR] Google batch ${batchNum}: ${response.status} — ${errorBody}`);
      return null;
    }

    const json = await response.json();
    const translations = json?.data?.translations;

    if (!translations || translations.length !== orderedKeys.length) {
      console.error(`\n     [ERR] Google batch ${batchNum}: Response length mismatch (expected ${orderedKeys.length}, got ${translations?.length || 0})`);
      return null;
    }

    // Map translations back to key-value pairs
    const result = {};
    for (let i = 0; i < orderedKeys.length; i++) {
      result[orderedKeys[i]] = translations[i].translatedText;
    }

    const charCount = sourceTexts.reduce((sum, t) => sum + t.length, 0);
    process.stdout.write(`  ✓ Google batch ${batchNum} (${orderedKeys.length} keys, ${charCount} chars)`);

    return result;
  }

  /**
   * Estimate translation cost at Google's documented rate ($20/million chars).
   * Source: https://cloud.google.com/translate/pricing
   */
  estimateCost(keyCount) {
    // Average UI string: ~25 characters
    const estimatedChars = keyCount * EST_CHARS_PER_KEY;
    const costPerChar = 20 / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedChars * costPerChar * 10000) / 10000,
      currency: 'USD',
      source: 'google-cloud-pricing',
      note: 'Based on Google Cloud Translation API v2 pricing ($20/1M chars). Actual cost depends on string length.',
    };
  }

  checkReadiness(_context) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { ready: false, reason: 'No Google Translate API key (GOOGLE_TRANSLATE_API_KEY or GOOGLE_API_KEY).' };
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
          name: 'Google Cloud Translation API',
          license: 'Proprietary (Google ToS)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }

  getSetupHelp() {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Google Translate requires a Google Cloud API key.              │',
        '  │                                                                │',
        '  │ 1. Enable the Cloud Translation API in Google Cloud Console    │',
        '  │ 2. Create an API key under APIs & Services > Credentials       │',
        '  │ 3. Run: export GOOGLE_TRANSLATE_API_KEY=...                    │',
        '  │                                                                │',
        '  │ Note: Google Translate works for key-value pairs but cannot    │',
        '  │ safely translate Markdown content (no code block awareness).   │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Google Cloud Console for quota/billing.'];
  }
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/**
 * Normalize rosetta locale codes to Google Translate codes.
 *
 * Google uses BCP-47 but with some quirks:
 *   - 'zh-TW' → 'zh-TW' (fine)
 *   - 'crk' → not supported by Google (will return error)
 *   - Some codes need mapping: 'he' ↔ 'iw', 'jw' ↔ 'jv'
 *
 * @param {string} locale - Rosetta locale code
 * @returns {string} Google-compatible locale code
 */
function normalizeLocaleForGoogle(locale) {
  const GOOGLE_LOCALE_MAP = {
    'he': 'iw',   // Hebrew: BCP-47 is 'he', Google uses 'iw'
    'jv': 'jw',   // Javanese: BCP-47 is 'jv', Google uses 'jw'
  };
  return GOOGLE_LOCALE_MAP[locale] || locale;
}

export { GoogleTranslateMethod, normalizeLocaleForGoogle };
