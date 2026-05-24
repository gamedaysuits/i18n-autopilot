/**
 * Translation Memory (TM) — lightweight same-project cache.
 *
 * WHY THIS EXISTS:
 *   Without TM, re-running `rosetta sync` after changing ONE English key
 *   re-translates every key that was modified, including keys that already
 *   have perfectly good translations from a previous run with the same
 *   source text. This wastes API tokens and adds latency.
 *
 *   Common scenarios this helps:
 *     1. Source key reverted to a previous value → TM provides instant hit
 *     2. Same phrase appears in multiple locale files → first translation cached
 *     3. Dry-run followed by real sync → second run reuses TM from first
 *     4. Developer iterating on a single file → only truly new keys hit the API
 *
 * HOW IT WORKS:
 *   TM is a JSON file at .rosetta/tm.json in the project root.
 *
 *   Cache key: SHA-256(sourceValue + '\x00' + targetLocale + '\x00' + method)
 *   - Including the method ensures translations from Google Translate aren't
 *     served when the user switches to DeepL or a coached LLM model.
 *   - The null byte separator prevents "ab" + "c" colliding with "a" + "bc".
 *
 *   Cache value: { translation, timestamp }
 *   - timestamp is ISO-8601, used for informational/debugging purposes only.
 *   - No TTL — translations don't expire. Users can delete .rosetta/tm.json
 *     to clear the cache entirely.
 *
 * STORAGE FORMAT:
 *   {
 *     "_meta": { "version": 1, "created": "2026-05-24T05:30:00Z" },
 *     "abc123...": { "t": "Bonjour", "ts": "2026-05-24T05:30:00Z" }
 *   }
 *
 *   Keys are abbreviated ('t' for translation, 'ts' for timestamp) to keep
 *   the file compact. At 50 languages × 500 keys = 25,000 entries, the file
 *   should be ~2-3 MB — comfortably manageable.
 *
 * USAGE:
 *   import { loadTM, saveTM, lookupTM, storeTM } from './tm.js';
 *
 *   const tm = loadTM(cwd);
 *   const cached = lookupTM(tm, sourceValue, 'fr', 'llm');
 *   if (cached) { use cached; }
 *   else { translate, then storeTM(tm, sourceValue, 'fr', 'llm', translated); }
 *   saveTM(cwd, tm);
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Current TM format version. If the format changes in a backward-incompatible
 * way, bump this to invalidate old caches.
 */
const TM_VERSION = 1;

/**
 * Default path relative to project root.
 */
const TM_DIR = '.rosetta';
const TM_FILENAME = 'tm.json';

// -----------------------------------------------------------------
// Cache key generation
// -----------------------------------------------------------------

/**
 * Generate a cache key for a source value + locale + method triple.
 *
 * Uses SHA-256 truncated to 16 hex characters (64 bits). Collision probability
 * at 100k entries: ~3×10⁻¹⁰ — negligible. If a collision occurs, the worst
 * case is serving one wrong cached translation that would be overwritten on
 * the next sync anyway.
 *
 * @param {string} sourceValue - Source language value
 * @param {string} locale - Target locale code
 * @param {string} method - Translation method name
 * @returns {string} 16-char hex hash
 */
function cacheKey(sourceValue, locale, method) {
  const input = `${sourceValue}\x00${locale}\x00${method}`;
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

// -----------------------------------------------------------------
// TM lifecycle
// -----------------------------------------------------------------

/**
 * Load the translation memory from disk.
 *
 * Returns an empty TM object if the file doesn't exist or is corrupt.
 * Logs a warning on corruption but never throws — a missing TM
 * just means no cache hits (cold start).
 *
 * @param {string} cwd - Project root directory
 * @returns {object} TM object (mutable — callers add entries, then save)
 */
function loadTM(cwd) {
  const tmPath = path.join(cwd, TM_DIR, TM_FILENAME);

  if (!fs.existsSync(tmPath)) {
    return _createEmptyTM();
  }

  try {
    const raw = fs.readFileSync(tmPath, 'utf-8');
    const data = JSON.parse(raw);

    // Version check — if format changed, start fresh
    if (!data._meta || data._meta.version !== TM_VERSION) {
      console.error(`     [TM] Cache version mismatch (expected ${TM_VERSION}). Starting fresh.`);
      return _createEmptyTM();
    }

    return data;
  } catch (err) {
    console.error(`     [TM] Failed to load ${tmPath}: ${err.message}. Starting fresh.`);
    return _createEmptyTM();
  }
}

/**
 * Save the translation memory to disk.
 *
 * Creates the .rosetta/ directory if it doesn't exist.
 * Writes atomically (write to .tmp, rename) to prevent corruption
 * if the process is killed mid-write.
 *
 * @param {string} cwd - Project root directory
 * @param {object} tm - TM object to save
 */
function saveTM(cwd, tm) {
  const dirPath = path.join(cwd, TM_DIR);
  const tmPath = path.join(dirPath, TM_FILENAME);
  const tmpPath = tmPath + '.tmp';

  // Ensure .rosetta/ directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const json = JSON.stringify(tm, null, 0); // compact — no pretty-printing
  fs.writeFileSync(tmpPath, json, 'utf-8');
  fs.renameSync(tmpPath, tmPath);
}

/**
 * Look up a cached translation.
 *
 * @param {object} tm - TM object (from loadTM)
 * @param {string} sourceValue - Source language value
 * @param {string} locale - Target locale code
 * @param {string} method - Translation method name
 * @returns {string|null} Cached translation, or null for cache miss
 */
function lookupTM(tm, sourceValue, locale, method) {
  const key = cacheKey(sourceValue, locale, method);
  const entry = tm[key];
  if (entry && typeof entry.t === 'string') {
    return entry.t;
  }
  return null;
}

/**
 * Store a translation in the TM.
 *
 * @param {object} tm - TM object (mutated in place)
 * @param {string} sourceValue - Source language value
 * @param {string} locale - Target locale code
 * @param {string} method - Translation method name
 * @param {string} translation - Translated value to cache
 */
function storeTM(tm, sourceValue, locale, method, translation) {
  const key = cacheKey(sourceValue, locale, method);
  tm[key] = {
    t: translation,
    ts: new Date().toISOString(),
    l: locale,   // locale code — enables per-locale stats and filtering
    m: method,   // method name — enables per-method stats
  };
}

/**
 * Partition a set of keys into TM hits and TM misses.
 *
 * This is the main entry point for the sync pipeline:
 *   1. Load source values for the keys that need translation
 *   2. Check each against TM
 *   3. Return hits (reuse immediately) and misses (send to API)
 *
 * @param {object} tm - TM object
 * @param {object} sourceFlat - Full source key→value map
 * @param {string[]} keysToTranslate - Keys that need translation
 * @param {string} locale - Target locale code
 * @param {string} method - Translation method name
 * @returns {{ hits: object, misses: string[] }} hits is key→cached translation, misses is keys to translate
 */
function partitionByTM(tm, sourceFlat, keysToTranslate, locale, method) {
  const hits = {};
  const misses = [];

  for (const key of keysToTranslate) {
    const sourceValue = sourceFlat[key];
    if (typeof sourceValue !== 'string') {
      misses.push(key);
      continue;
    }

    const cached = lookupTM(tm, sourceValue, locale, method);
    if (cached !== null) {
      hits[key] = cached;
    } else {
      misses.push(key);
    }
  }

  return { hits, misses };
}

/**
 * Get the number of cached entries in a TM (excluding metadata).
 *
 * @param {object} tm - TM object
 * @returns {number} Entry count
 */
function tmSize(tm) {
  return Object.keys(tm).filter(k => k !== '_meta').length;
}

// -----------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------

function _createEmptyTM() {
  return {
    _meta: {
      version: TM_VERSION,
      created: new Date().toISOString(),
    },
  };
}

// -----------------------------------------------------------------
// Exports
// -----------------------------------------------------------------

export {
  loadTM,
  saveTM,
  lookupTM,
  storeTM,
  partitionByTM,
  tmSize,
  cacheKey,
  TM_VERSION,
  TM_DIR,
  TM_FILENAME,
};
