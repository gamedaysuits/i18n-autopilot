/**
 * Translation Quality Gate — deterministic output validation.
 *
 * WHY: LLMs producing conlang/fictional translations often generate:
 *   - Repetitive nonsense ("Qo' Qo' Qo' Qo'") — hallucination loop
 *   - Drastically inflated output (300+ chars for a 5-char source) — padding
 *   - ASCII text for non-Latin scripts — wrong script entirely
 *   - Source text echoed back verbatim — lazy passthrough
 *
 * This module provides fast, deterministic checks that catch these failure
 * modes BEFORE translations are written to locale files. Failed keys are
 * logged loudly and excluded from the result.
 *
 * HOW IT WORKS:
 *   The sync loop calls `validateTranslations()` on the merged output of
 *   each language pair. Each key-value pair is checked against:
 *     1. Repetition detector (trigram frequency analysis)
 *     2. Length ratio check (source vs translated length)
 *     3. Script compliance (non-Latin locales must produce non-ASCII)
 *     4. Source echo check (translated value ≠ source value)
 *
 *   Keys that fail any check are removed and logged as [GATE] failures.
 *   The caller receives only validated translations.
 *
 * CONFIGURATION:
 *   Per-language overrides can be set via the pair config:
 *     "languages": { "tlh": { "maxLengthRatio": 5, "requireNonLatin": true } }
 */

/**
 * Locales whose scripts are predominantly non-Latin.
 * Translations for these locales that contain ONLY ASCII characters
 * are almost certainly wrong (the model produced English or romanized text).
 */
const NON_LATIN_LOCALES = new Set([
  // CJK
  'zh', 'zh-CN', 'zh-TW', 'zh-HK', 'ja', 'ko',
  // Cyrillic
  'ru', 'uk', 'bg', 'sr',
  // Arabic/Persian/Urdu
  'ar', 'fa', 'ur',
  // Devanagari/Indic
  'hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'ne', 'pa', 'ta', 'te',
  // Thai/Lao/Khmer
  'th', 'lo', 'km',
  // Georgian/Armenian
  'ka', 'hy',
  // Hebrew
  'he',
  // Greek
  'el',
  // Plains Cree (Syllabics)
  'crk',
]);

/**
 * Default validation thresholds.
 * These are intentionally generous — the goal is to catch gross failures,
 * not nitpick edge cases. Tighter thresholds can be set per-language.
 */
const DEFAULT_THRESHOLDS = {
  // Max ratio of translated length to source length before flagging.
  // e.g., 4.0 means translated text can be up to 4x longer than source.
  // Some languages (German, Finnish) legitimately produce longer text.
  maxLengthRatio: 4.0,

  // Min ratio of translated length to source length before flagging.
  // Catches truncation/empty output masquerading as translation.
  minLengthRatio: 0.1,

  // Max percentage of repeated trigrams before flagging as hallucination.
  // A hallucinated output like "Qo' Qo' Qo'" has ~100% repetition.
  // Normal text in any language rarely exceeds 30%.
  maxRepetitionRate: 0.60,

  // Whether to require non-ASCII characters for non-Latin locales.
  // When true, a translation containing only ASCII for a CJK/Cyrillic/etc
  // locale is flagged as wrong-script.
  requireNonLatin: true,
};

/**
 * Validate a batch of translations and return only passing keys.
 *
 * @param {object} translations - Key → translated value map
 * @param {object} sourceFlat - Key → source value map (for comparison)
 * @param {object} pairConfig - Pair config (target locale, thresholds)
 * @param {object} [options] - Override thresholds for testing
 * @returns {{ validated: object, failures: Array<{ key: string, reason: string, value: string }> }}
 */
function validateTranslations(translations, sourceFlat, pairConfig, options = {}) {
  const targetLocale = pairConfig.target || pairConfig.locale || '';
  const isNonLatin = NON_LATIN_LOCALES.has(targetLocale) || NON_LATIN_LOCALES.has(targetLocale.split('-')[0]);

  // Merge thresholds: options > pairConfig > defaults
  const thresholds = {
    maxLengthRatio: options.maxLengthRatio ?? pairConfig.maxLengthRatio ?? DEFAULT_THRESHOLDS.maxLengthRatio,
    minLengthRatio: options.minLengthRatio ?? pairConfig.minLengthRatio ?? DEFAULT_THRESHOLDS.minLengthRatio,
    maxRepetitionRate: options.maxRepetitionRate ?? pairConfig.maxRepetitionRate ?? DEFAULT_THRESHOLDS.maxRepetitionRate,
    requireNonLatin: options.requireNonLatin ?? pairConfig.requireNonLatin ?? DEFAULT_THRESHOLDS.requireNonLatin,
  };

  const validated = {};
  const failures = [];

  for (const [key, translated] of Object.entries(translations)) {
    const source = sourceFlat[key] || '';

    // Skip non-string values (shouldn't happen, but defense-in-depth)
    if (typeof translated !== 'string') {
      failures.push({ key, reason: 'non-string value', value: String(translated) });
      continue;
    }

    // Check 1: Empty translation
    if (translated.trim().length === 0) {
      failures.push({ key, reason: 'empty translation', value: translated });
      continue;
    }

    // Check 2: Source echo — translated value is identical to source.
    // EXEMPTION: Short strings (≤30 chars) that are mostly ASCII are likely
    // proper nouns, brand names, or technical terms (e.g. "Blog", "GitHub",
    // "npm", "CLI Reference") that legitimately stay in English across all
    // languages. Rejecting these creates an infinite retry loop where the
    // correct translation is rejected every time, burning API calls forever.
    if (translated === source) {
      const asciiRatio = source.replace(/[^\x20-\x7E]/g, '').length / Math.max(source.length, 1);
      const isShortAscii = source.length <= 30 && asciiRatio > 0.8;
      if (!isShortAscii) {
        failures.push({ key, reason: 'source echo (identical to English)', value: translated });
        continue;
      }
      // Short ASCII string echoed back — accept it as a valid translation
    }

    // Check 3: Repetition detection — catches hallucination loops.
    // For pipe-delimited plural strings (e.g. "one doc|{count} docs"),
    // measure each variant independently — plural forms legitimately
    // share most of their text, which inflates the trigram count.
    const repetitionSegments = translated.includes('|')
      ? translated.split('|')
      : [translated];
    const maxSegmentRepetition = Math.max(
      ...repetitionSegments.map(seg => measureRepetition(seg.trim()))
    );
    if (maxSegmentRepetition > thresholds.maxRepetitionRate) {
      failures.push({
        key,
        reason: `repetition hallucination (${(maxSegmentRepetition * 100).toFixed(0)}% repeated trigrams)`,
        value: translated.slice(0, 80) + (translated.length > 80 ? '...' : ''),
      });
      continue;
    }

    // Check 4: Length ratio — catches padding and truncation
    if (source.length > 0) {
      const ratio = translated.length / source.length;
      if (ratio > thresholds.maxLengthRatio) {
        failures.push({
          key,
          reason: `length inflation (${ratio.toFixed(1)}x source, max ${thresholds.maxLengthRatio}x)`,
          value: translated.slice(0, 80) + (translated.length > 80 ? '...' : ''),
        });
        continue;
      }
      if (ratio < thresholds.minLengthRatio) {
        failures.push({
          key,
          reason: `suspiciously short (${(ratio * 100).toFixed(0)}% of source length)`,
          value: translated,
        });
        continue;
      }
    }

    // Check 5: Script compliance — non-Latin locales must have non-ASCII chars.
    // EXEMPTIONS:
    //   - Strings with no translatable text after stripping ICU placeholders
    //     ({...}), digits, punctuation, and whitespace. e.g. "{authorName} - {nPosts}"
    //     or version strings like "3.2.0" have nothing to write in another script.
    //   - Short ASCII strings (≤30 chars, >80% ASCII) are likely proper nouns
    //     or brand names (e.g. "GitHub", "npm") that stay in English everywhere.
    if (isNonLatin && thresholds.requireNonLatin) {
      // Strip ICU placeholders, digits, punctuation, whitespace → what's left?
      const translatableText = translated
        .replace(/\{[^}]*\}/g, '')   // ICU placeholders
        .replace(/[\d\s\p{P}\p{S}]/gu, '')  // digits, whitespace, punctuation, symbols
        .trim();
      const asciiRatio = source.replace(/[^\x20-\x7E]/g, '').length / Math.max(source.length, 1);
      const isShortAsciiPropNoun = source.length <= 30 && asciiRatio > 0.8;
      if (translatableText.length > 0 && isAsciiOnly(translated) && !isShortAsciiPropNoun) {
        failures.push({
          key,
          reason: `wrong script (ASCII-only for ${targetLocale}, expected non-Latin characters)`,
          value: translated.slice(0, 80),
        });
        continue;
      }
    }

    // All checks passed
    validated[key] = translated;
  }

  return { validated, failures };
}

/**
 * Measure repetition rate using trigram frequency analysis.
 *
 * Splits the text into overlapping 3-character trigrams and counts how
 * many are repeated. A hallucinated output like "Qo' Qo' Qo'" produces
 * a very high rate because the same trigrams appear over and over.
 *
 * @param {string} text - Text to analyze
 * @returns {number} Repetition rate (0.0 = no repetition, 1.0 = all repeated)
 */
function measureRepetition(text) {
  // Short texts can't meaningfully repeat — skip
  if (text.length < 12) return 0;

  const trigrams = {};
  let totalTrigrams = 0;

  for (let i = 0; i <= text.length - 3; i++) {
    const trigram = text.slice(i, i + 3);
    trigrams[trigram] = (trigrams[trigram] || 0) + 1;
    totalTrigrams++;
  }

  if (totalTrigrams === 0) return 0;

  // Count how many trigrams appear more than once
  let repeatedCount = 0;
  for (const count of Object.values(trigrams)) {
    if (count > 1) {
      repeatedCount += count;
    }
  }

  return repeatedCount / totalTrigrams;
}

/**
 * Check if a string contains only ASCII characters (codes 0-127).
 * Used to detect wrong-script output for non-Latin locales.
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if text is ASCII-only
 */
function isAsciiOnly(text) {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(text);
}

/**
 * Log quality gate failures in a structured, actionable format.
 *
 * @param {Array<{ key: string, reason: string, value: string }>} failures
 * @param {string} pairKey - e.g., "en:tlh"
 */
function logGateFailures(failures, pairKey) {
  if (failures.length === 0) return;

  console.error(`\n     [GATE] ${pairKey}: ${failures.length} key(s) failed quality validation:`);
  for (const { key, reason, value } of failures) {
    console.error(`            ✗ "${key}": ${reason}`);
    if (value) {
      console.error(`              → "${value}"`);
    }
  }
  console.error('');
}

export {
  validateTranslations,
  measureRepetition,
  isAsciiOnly,
  logGateFailures,
  NON_LATIN_LOCALES,
  DEFAULT_THRESHOLDS,
};
