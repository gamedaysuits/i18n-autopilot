import path from 'node:path';
import fs from 'node:fs';
import { TranslationMethod } from './base.js';
import { getEnvOrFileVar } from '../api-key.js';
import { loadCoachingData, DEFAULT_COACHING_DIR } from './llm-coached.js';
import { getLanguageCard } from '../registers.js';
import {
  MAX_RETRIES,
  isRetryable,
  getBackoffDelay,
  sleep,
} from './http-utils.js';

const DEEPL_REQUEST_TIMEOUT_MS = 15000;

class DeepLMethod extends TranslationMethod {
  constructor(options = {}) {
    super('deepl', options);
    this._coachingCache = new Map();
  }

  /**
   * Translate a batch of key-value pairs via DeepL API.
   *
   * @param {string[]} keys - Flat dot-notation keys to translate
   * @param {object} sourceFlat - Full flattened source locale
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - { apiKey, batchSize }
   * @returns {object|null} Map of key → translated value, or null
   */
  async translate(keys, sourceFlat, pairConfig, options) {
    const apiKey = options.deeplApiKey
      || getEnvOrFileVar('DEEPL_API_KEY')
      || getEnvOrFileVar('DEEPL_API_KEY', options.cwd);

    if (!apiKey) {
      console.error('     [WARN] DeepL: no API key — skipping.');
      return null;
    }

    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';
    const allTranslated = {};

    // Determine DeepL API base URL based on key suffix
    const isFree = apiKey.endsWith(':fx');
    const apiBase = isFree ? 'https://api-free.deepl.com' : 'https://api.deepl.com';

    // Determine DeepL formality parameter from language card metadata.
    //
    // HOW: Each register preset in a language card can declare a `deeplFormality`
    // field ('prefer_more', 'prefer_less', or 'default') that maps directly to
    // DeepL's API parameter. This is fully data-driven — no regex heuristics on
    // preset key names.
    //
    // WHY data-driven: DeepL supports formality across multiple formality
    // *systems* — T-V (French), keigo (Japanese), pronoun hierarchies (Vietnamese).
    // A regex on key names (e.g., /formal|vous/) was fragile: it broke for
    // neutral presets, non-Latin key names, and languages where the formal/casual
    // boundary doesn't map to T-V. Putting the mapping in the data means each
    // language card author explicitly declares what DeepL should do.
    //
    // WHY prefer_*: 'prefer_more'/'prefer_less' gracefully degrade to 'default'
    // for unsupported languages instead of returning an API error.
    let formality = 'default';
    const card = getLanguageCard(targetLocale);
    if (card?.methodSupport?.deeplFormality) {
      // Look up the active preset's declared DeepL formality mapping.
      // pairConfig.registerPreset holds the preset key name (e.g., "casual-tu"),
      // while pairConfig.register holds the resolved prompt text. We need
      // the key to look up preset-specific metadata like deeplFormality.
      const presetKey = pairConfig.registerPreset;
      const activePreset = presetKey && card.registers?.[presetKey];
      if (activePreset?.deeplFormality) {
        // Preset has an explicit mapping — use it directly
        formality = activePreset.deeplFormality;
      } else {
        // No active preset key (custom text) or no mapping — use card default
        const defaultKey = card.formality?.default;
        const defaultPreset = defaultKey && card.registers?.[defaultKey];
        if (defaultPreset?.deeplFormality) {
          formality = defaultPreset.deeplFormality;
        }
      }
    }

    // Load coaching data for glossary creation
    const cwd = options.cwd || process.cwd();
    const coachingDir = options.coachingDir || path.join(cwd, DEFAULT_COACHING_DIR);
    const coaching = loadCoachingData(coachingDir, targetLocale, this._coachingCache);

    let glossaryId = null;
    if (coaching && coaching.dictionary && Object.keys(coaching.dictionary).length > 0) {
      glossaryId = await this._syncGlossary(apiBase, apiKey, sourceLocale, targetLocale, coaching.dictionary);
    }

    const maxSegments = pairConfig.batchSize || options.batchSize || 128;

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
        apiBase,
        apiKey,
        orderedKeys,
        sourceTexts,
        sourceLocale,
        targetLocale,
        formality,
        glossaryId,
        batchNum,
      });

      if (result) {
        Object.assign(allTranslated, result);
      }
    }

    return Object.keys(allTranslated).length > 0 ? allTranslated : null;
  }

  /**
   * Translate freeform Markdown content via DeepL API.
   *
   * Uses the same protect/restore approach as Google Translate — the caller
   * has already shielded code blocks and shortcodes with ⟦PROTECTED_N⟧
   * placeholders. We send the protected text through DeepL as a single
   * translation request.
   *
   * @param {string} prompt - Complete translation prompt from buildContentPrompt()
   * @param {import('../types.js').PairConfig} pairConfig - Pair config
   * @param {object} options - { apiKey }
   * @returns {string|null} Translated text, or null on failure
   */
  async translateContent(prompt, pairConfig, options) {
    const apiKey = options.deeplApiKey
      || getEnvOrFileVar('DEEPL_API_KEY')
      || getEnvOrFileVar('DEEPL_API_KEY', options.cwd);

    if (!apiKey) {
      console.error('     [WARN] DeepL: no API key — skipping.');
      return null;
    }

    // Extract the Markdown body from the translation prompt
    const separator = '\n---\n';
    const sepIdx = prompt.indexOf(separator);
    const bodyText = sepIdx !== -1 ? prompt.slice(sepIdx + separator.length) : prompt;
    if (!bodyText.trim()) return null;

    const isFree = apiKey.endsWith(':fx');
    const apiBase = isFree ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
    const targetLocale = pairConfig.target;
    const sourceLocale = pairConfig.source || 'en';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEEPL_REQUEST_TIMEOUT_MS * 2);

        const response = await fetch(`${apiBase}/v2/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
          },
          body: JSON.stringify({
            text: [bodyText],
            target_lang: targetLocale.toUpperCase(),
            source_lang: sourceLocale.toUpperCase(),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isRetryable(response.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.error(`\n     ⏳ DeepL content: ${response.status} — retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
          console.error(`\n     [ERR] DeepL content: ${response.status} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`\n     [ERR] DeepL content: ${response.status} — ${errorBody}`);
          return null;
        }

        const json = await response.json();
        const translations = json?.translations;
        if (!translations || translations.length === 0) {
          console.error('\n     [ERR] DeepL content: empty response');
          return null;
        }

        return translations[0].text;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.error('\n     ⏳ DeepL content: Timeout — retrying...');
        } else if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.error(`\n     ⏳ DeepL content: ${err.message} — retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        } else {
          console.error(`\n     [ERR] DeepL content: ${err.message} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }
      }
    }
    return null;
  }

  estimateCost(keyCount) {
    const estimatedChars = keyCount * 25;
    const costPerChar = 20 / 1_000_000;
    return {
      estimatedCost: Math.round(estimatedChars * costPerChar * 10000) / 10000,
      currency: 'USD',
      source: 'deepl-pricing',
      note: 'Based on DeepL API pricing ($20/1M chars). Actual cost depends on string length.',
    };
  }

  getQualityTier() {
    return 'standard';
  }

  getProvenance() {
    return {
      resources: [
        {
          name: 'DeepL Translation API',
          license: 'Proprietary (DeepL ToS)',
          type: 'api',
        },
      ],
      commercialReady: true,
      flags: [],
    };
  }

  // Helper to load coaching data
  // _loadCoachingData — removed: now uses shared loadCoachingData from llm-coached.js


  // Create or get glossary on DeepL
  async _syncGlossary(apiBase, apiKey, sourceLang, targetLang, dictionary) {
    const sortedEntries = Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b));
    if (sortedEntries.length === 0) return null;

    const contentStr = sortedEntries.map(([s, t]) => `${s}\t${t}`).join('\n');
    let hash = 0;
    for (let i = 0; i < contentStr.length; i++) {
      hash = (hash << 5) - hash + contentStr.charCodeAt(i);
      hash |= 0;
    }
    const hashStr = Math.abs(hash).toString(16);

    const sLang = sourceLang.toUpperCase();
    const tLang = targetLang.toUpperCase();
    const glossaryName = `rosetta_${sLang.toLowerCase()}_${tLang.toLowerCase()}_${hashStr}`;

    try {
      // 1. List existing glossaries to see if we already created it
      const listResponse = await fetch(`${apiBase}/v2/glossaries`, {
        method: 'GET',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
        },
      });

      if (listResponse.ok) {
        const listJson = await listResponse.json();
        const existing = listJson.glossaries?.find(
          g => g.name === glossaryName && g.source_lang === sLang && g.target_lang === tLang
        );
        if (existing) {
          return existing.glossary_id;
        }
      }

      // 2. Create glossary if not found
      const createResponse = await fetch(`${apiBase}/v2/glossaries`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: glossaryName,
          source_lang: sLang,
          target_lang: tLang,
          entries: contentStr,
          entries_format: 'tsv',
        }),
      });

      if (createResponse.ok) {
        const createJson = await createResponse.json();
        return createJson.glossary_id;
      } else {
        const errText = await createResponse.text();
        console.warn(`\n     [WARN] DeepL: Failed to create glossary "${glossaryName}": ${createResponse.status} - ${errText}`);
        return null;
      }
    } catch (err) {
      console.warn(`\n     [WARN] DeepL: Glossary sync error: ${err.message}`);
      return null;
    }
  }

  async _translateBatchWithRetry(params) {
    const {
      apiBase,
      apiKey,
      orderedKeys,
      sourceTexts,
      sourceLocale,
      targetLocale,
      formality,
      glossaryId,
      batchNum,
    } = params;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEEPL_REQUEST_TIMEOUT_MS);

        const body = {
          text: sourceTexts,
          target_lang: targetLocale.toUpperCase(),
          source_lang: sourceLocale.toUpperCase(),
        };

        if (formality && formality !== 'default') {
          body.formality = formality;
        }
        if (glossaryId) {
          body.glossary_id = glossaryId;
        }

        const response = await fetch(`${apiBase}/v2/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isRetryable(response.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = getBackoffDelay(attempt);
            console.error(`\n     ⏳ DeepL batch ${batchNum}: ${response.status} — retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
            continue;
          }
          console.error(`\n     [ERR] DeepL batch ${batchNum}: ${response.status} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          // If we passed a glossary_id and got a 400 bad request, try again without the glossary
          if (response.status === 400 && glossaryId) {
            console.warn(`\n     [WARN] DeepL batch ${batchNum} failed with glossary. Retrying without glossary...`);
            return this._translateBatchWithRetry({
              ...params,
              glossaryId: null,
            });
          }
          console.error(`\n     [ERR] DeepL batch ${batchNum}: ${response.status} — ${errorBody}`);
          return null;
        }

        const json = await response.json();
        const translations = json?.translations;

        if (!translations || translations.length !== orderedKeys.length) {
          console.error(`\n     [ERR] DeepL batch ${batchNum}: Response length mismatch (expected ${orderedKeys.length}, got ${translations?.length || 0})`);
          return null;
        }

        const result = {};
        for (let i = 0; i < orderedKeys.length; i++) {
          result[orderedKeys[i]] = translations[i].text;
        }

        const charCount = sourceTexts.reduce((sum, t) => sum + t.length, 0);
        process.stdout.write(`  ✓ DeepL batch ${batchNum} (${orderedKeys.length} keys, ${charCount} chars)`);

        return result;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.error(`\n     ⏳ DeepL batch ${batchNum}: Timeout — retrying...`);
        } else if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt);
          console.error(`\n     ⏳ DeepL batch ${batchNum}: ${err.message} — retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
        } else {
          console.error(`\n     [ERR] DeepL batch ${batchNum}: ${err.message} after ${MAX_RETRIES + 1} attempts`);
          return null;
        }
      }
    }
    return null;
  }
}

export { DeepLMethod };
