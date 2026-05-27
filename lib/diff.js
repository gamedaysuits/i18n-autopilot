/**
 * Key diff engine — compares source locale against target locales.
 *
 * Detects six categories of keys:
 *   1. Missing:       exist in source but not in target
 *   2. Stale:         exist in target but removed from source
 *   3. Fallback:      exist in target but prefixed with [EN] (need real translation)
 *   4. Untranslated:  target value is identical to source value (likely pre-populated
 *                     by tools like `docusaurus write-translations` with English defaults)
 *   5. Changed:       source content hash differs from last sync (auto-detected)
 *   6. Forced:        explicitly requested for re-translation via --force-keys
 *
 * WHY: The diff is the decision layer that determines what work needs
 * to be done. By separating it from the translation and write layers,
 * we can dry-run, audit, or sync with identical detection logic.
 *
 * WHY "untranslated": Docusaurus's `write-translations` pre-populates
 * ALL locale directories with English defaults. Without this check,
 * the diff sees "key exists, value present, no [EN] prefix" and skips
 * it — leaving entire locales (e.g. Thai, Filipino) completely untranslated.
 */

import { flattenKeys } from './flatten.js';

/**
 * Diff a target locale against the source.
 *
 * @param {object} sourceFlat - Flattened source locale
 * @param {object} targetFlat - Flattened target locale
 * @param {string} fallbackPrefix - The prefix marking untranslated values (default: "[EN] ")
 * @param {string[]} forceKeys - Dot-notation keys to force re-translate (default: [])
 * @param {string[]} changedKeys - Keys detected as changed via content hashing (default: [])
 * @returns {import('./types.js').DiffResult} Diff result with missing, needsTranslation, untranslated, changed, forced, extra, toProcess
 */
function diffLocale(sourceFlat, targetFlat, fallbackPrefix = '[EN] ', forceKeys = [], changedKeys = []) {
  const sourceKeys = new Set(Object.keys(sourceFlat));
  const targetKeys = new Set(Object.keys(targetFlat));

  // Keys in source but not in target
  const missing = [...sourceKeys].filter(k => !targetKeys.has(k));

  // Keys in target that are still [EN]-prefixed fallbacks
  const needsTranslation = [...targetKeys].filter(k =>
    typeof targetFlat[k] === 'string' && targetFlat[k].startsWith(fallbackPrefix)
  );

  // Keys where target value is identical to source value.
  // This catches locales pre-populated with English defaults by tools
  // like `docusaurus write-translations`. Without this, Thai/Filipino/etc.
  // would appear "fully synced" with all-English content.
  //
  // Only flag string values that aren't already caught by needsTranslation,
  // and skip very short values (1-2 chars) that are likely intentionally
  // identical across locales (e.g. punctuation, symbols, numbers).
  const needsTranslationSet = new Set(needsTranslation);
  const untranslated = [...targetKeys].filter(k => {
    if (needsTranslationSet.has(k)) return false; // already flagged
    if (!sourceKeys.has(k)) return false; // extra key, not our concern
    const sv = sourceFlat[k];
    const tv = targetFlat[k];
    // Only compare string values
    if (typeof sv !== 'string' || typeof tv !== 'string') return false;
    // Skip very short values — punctuation, numbers, symbols are
    // often intentionally identical across locales.
    if (sv.length <= 2) return false;
    return sv === tv;
  });

  // Keys whose English source content changed since last sync (auto-detected).
  // Only include keys that exist in the source (defensive filter).
  const changed = changedKeys.filter(k => sourceKeys.has(k));

  // Keys explicitly forced for re-translation (only if they exist in source).
  // Silently ignore any forced keys that don't exist in the source.
  const forced = forceKeys.filter(k => sourceKeys.has(k));

  // Keys in target but not in source (stale/orphaned)
  const extra = [...targetKeys].filter(k => !sourceKeys.has(k));

  // Combined set of keys that need work (deduplicated)
  const toProcess = [...new Set([...missing, ...needsTranslation, ...untranslated, ...changed, ...forced])];

  return { missing, needsTranslation, untranslated, changed, forced, extra, toProcess };
}

/**
 * Generate a human-readable label for the diff result.
 *
 * @param {import('./types.js').DiffResult} diff - Diff result from diffLocale
 * @returns {string} Human-readable summary (e.g., '3 missing + 1 [EN] fallback(s)')
 */
function diffLabel(diff) {
  const { missing, needsTranslation, untranslated, changed } = diff;
  const parts = [];
  if (missing.length > 0) parts.push(`${missing.length} missing`);
  if (needsTranslation.length > 0) parts.push(`${needsTranslation.length} [EN] fallback(s)`);
  if (untranslated && untranslated.length > 0) parts.push(`${untranslated.length} untranslated`);
  if (changed && changed.length > 0) parts.push(`${changed.length} changed`);
  if (parts.length > 0) return parts.join(' + ');
  return 'fully synced';
}

export { diffLocale, diffLabel };
