/**
 * Language card registry — structured language metadata and register presets.
 *
 * ARCHITECTURE (v5 — Two-Tier Cards):
 *
 *   The card system is split into two tiers for memory efficiency:
 *
 *   RUNTIME TIER — lib/data/language-cards/<code>.json
 *     Loaded eagerly at module init into memory (~1.4 KB avg per card).
 *     Contains only fields consumed by the translation pipeline:
 *       code, name, nativeName, ISO codes, script, dir, formality, gender,
 *       registers, aliases, methodSupport, scriptConverter, evalDatasets,
 *       notes, rules, extends, humanReviewed, glottocode
 *
 *   REFERENCE TIER — lib/data/language-reference/<code>.json
 *     Loaded lazily on demand (~3.7 KB avg per card).
 *     Contains developer-facing documentation not used at translation time:
 *       linguisticChallenges, encyclopedic, resources
 *
 *   WHY: At 700 languages, eagerly loading enriched cards would consume
 *   ~3.5 MB. The two-tier split keeps eager load to ~1 MB while still
 *   providing full reference data when explicitly requested.
 *
 *   ADDING A NEW LANGUAGE:
 *     1. Create lib/data/language-cards/<code>.json (runtime fields)
 *     2. Create lib/data/language-reference/<code>.json (reference fields)
 *     3. Research the language's formality system and write register presets
 *     4. Validate against schemas/language-card.schema.json
 *     5. Add eval dataset references if available
 *
 * BACKWARD COMPATIBILITY:
 *   DEFAULT_REGISTERS is still exported as a backward-compatible proxy.
 *   It returns the same shape as the old flat dictionary ({ name, register,
 *   dir?, scripts? }) so existing consumers don't break during migration.
 *   New code should use getLanguageCard() and getRegister() instead.
 */

import fs from 'node:fs';
import path from 'node:path';

// -----------------------------------------------------------------
// Card loading — reads all JSON files from language-cards/ at startup
// -----------------------------------------------------------------

/**
 * Directory containing individual language card JSON files.
 * Each file is named <code>.json and follows the language card schema.
 */
const CARDS_DIR = path.join(import.meta.dirname, 'data', 'language-cards');

/**
 * Directory containing reference-tier JSON files (linguisticChallenges,
 * encyclopedic, resources). These are NOT loaded at startup — only when
 * getLanguageReference() is called for a specific language.
 */
const REFERENCE_DIR = path.join(import.meta.dirname, 'data', 'language-reference');

/**
 * In-memory registry of all loaded language cards.
 * Keyed by primary locale code (e.g., 'fr', 'ko', 'x-pirate').
 * @type {Map<string, object>}
 */
const _cards = new Map();

/**
 * Registry of parent/abstract cards (families and subfamilies).
 * Keyed by code (e.g., 'family-algonquian', 'subfamily-cree').
 * @type {Map<string, object>}
 */
const _parentCards = new Map();

/**
 * Alias map — alternative locale codes that resolve to a primary code.
 * e.g., 'no' → 'nb', 'iw' → 'he', 'zh-CN' → 'zh', 'fil' → 'tl'
 * Built from the `aliases` field in each language card.
 * @type {Map<string, string>}
 */
const _aliases = new Map();

/**
 * Load all language card JSON files from the cards directory (recursively).
 * Called once at module initialization. Builds both the primary
 * card registry and the alias lookup table.
 */
function _loadCards() {
  if (!fs.existsSync(CARDS_DIR)) return;

  function scan(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const resPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(resPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(resPath, 'utf-8');
          const card = JSON.parse(raw);

          if (!card.code) {
            console.error(`[WARN] Language card ${entry.name} missing 'code' field — skipping.`);
            continue;
          }

          if (
            resPath.includes(path.sep + 'families' + path.sep) ||
            resPath.includes(path.sep + 'subfamilies' + path.sep) ||
            card.code.startsWith('family-') ||
            card.code.startsWith('subfamily-')
          ) {
            _parentCards.set(card.code, card);
          } else {
            _cards.set(card.code, card);

            // Register aliases
            if (Array.isArray(card.aliases)) {
              for (const alias of card.aliases) {
                _aliases.set(alias, card.code);
              }
            }
          }
        } catch (err) {
          console.error(`[WARN] Failed to load language card ${entry.name}: ${err.message}`);
        }
      }
    }
  }

  scan(CARDS_DIR);
}

// Load cards at module initialization
_loadCards();

// -----------------------------------------------------------------
// Public API — accessor functions for language cards and registers
// -----------------------------------------------------------------

/**
 * Resolve a locale code to its primary code, following aliases.
 *
 * Handles:
 *   - Direct match: 'fr' → 'fr'
 *   - Alias: 'no' → 'nb', 'iw' → 'he'
 *   - Base locale fallback: 'fr-CA' → 'fr-CA' (if card exists) or 'fr' (base)
 *
 * @param {string} code - Locale code to resolve
 * @returns {string} Resolved primary code
 */
function resolveCode(code) {
  // Direct match
  if (_cards.has(code)) return code;

  // Alias match
  if (_aliases.has(code)) return _aliases.get(code);

  // Base locale fallback — try stripping region (e.g., 'de-AT' → 'de')
  const baseParts = code.split('-');
  if (baseParts.length > 1) {
    const baseCode = baseParts[0];
    if (_cards.has(baseCode)) return baseCode;
    if (_aliases.has(baseCode)) return _aliases.get(baseCode);
  }

  // No match found — return original code (will get null from getLanguageCard)
  return code;
}

/**
 * Deep merge two card objects (child overrides parent).
 */
function _deepMerge(parent, child) {
  if (!parent) return child || {};
  if (!child) return parent || {};

  const result = { ...parent };
  for (const [key, value] of Object.entries(child)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      parent[key] &&
      typeof parent[key] === 'object' &&
      !Array.isArray(parent[key])
    ) {
      result[key] = _deepMerge(parent[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * In-memory cache of fully resolved/merged language cards.
 * Keyed by primary locale code.
 * @type {Map<string, object>}
 */
const _resolvedCards = new Map();

/**
 * Get the full language card for a locale code.
 *
 * Follows aliases and falls back to base locale. Returns null if
 * no card exists for this language.
 *
 * Resolves inheritance chains recursively if the 'extends' property is set.
 *
 * @param {string} code - Locale code (e.g., 'fr', 'ko', 'no', 'fr-CA')
 * @returns {object|null} Complete language card, or null
 */
function getLanguageCard(code) {
  // First check parents (no alias/base resolution needed for parent cards)
  if (_parentCards.has(code)) {
    if (_resolvedCards.has(code)) {
      return _resolvedCards.get(code);
    }
    const rawCard = _parentCards.get(code);
    let resolvedCard = rawCard;
    if (rawCard.extends) {
      const parentCard = getLanguageCard(rawCard.extends);
      if (parentCard) {
        resolvedCard = _deepMerge(parentCard, rawCard);
      }
    }
    _resolvedCards.set(code, resolvedCard);
    return resolvedCard;
  }

  const resolved = resolveCode(code);
  if (!_cards.has(resolved)) return null;

  if (_resolvedCards.has(resolved)) {
    return _resolvedCards.get(resolved);
  }

  const rawCard = _cards.get(resolved);
  let resolvedCard = rawCard;

  if (rawCard.extends) {
    const parentCard = getLanguageCard(rawCard.extends);
    if (parentCard) {
      resolvedCard = _deepMerge(parentCard, rawCard);
    } else {
      console.error(`[WARN] Language card '${resolved}' extends unknown card '${rawCard.extends}'.`);
    }
  }

  _resolvedCards.set(resolved, resolvedCard);
  return resolvedCard;
}

/**
 * Get the active register prompt text for a locale.
 *
 * Resolution order:
 *   1. If presetOrCustom matches a preset key in the card → use that preset's prompt
 *   2. If presetOrCustom is a non-empty string that doesn't match a preset → treat as custom text
 *   3. If presetOrCustom is null/undefined → use the card's default preset
 *   4. If no card exists → return generic fallback
 *
 * @param {string} code - Locale code
 * @param {string|null} [presetOrCustom] - Preset name (e.g., 'formal-vous') or custom register text
 * @returns {string} Register prompt text
 */

/** Fallback register text when no card or preset provides one. */
const DEFAULT_REGISTER_FALLBACK = 'Professional register.';

function getRegister(code, presetOrCustom) {
  const card = getLanguageCard(code);

  if (!card) {
    // No card — return custom text if provided, or generic fallback
    return presetOrCustom || DEFAULT_REGISTER_FALLBACK;
  }

  // No user override — use card's default preset
  if (!presetOrCustom) {
    const defaultKey = card.formality?.default || Object.keys(card.registers)[0];
    return card.registers[defaultKey]?.prompt || DEFAULT_REGISTER_FALLBACK;
  }

  // Check if it's a preset name
  if (card.registers[presetOrCustom]) {
    return card.registers[presetOrCustom].prompt;
  }

  // Not a preset name — treat as custom register text (pass-through)
  return presetOrCustom;
}

/**
 * Get all available register presets for a locale.
 *
 * Returns an array of { key, label, description, prompt, isDefault } objects
 * for use in the CLI wizard and status display.
 *
 * @param {string} code - Locale code
 * @returns {Array<{ key: string, label: string, description: string, prompt: string, isDefault: boolean }>}
 */
function getRegisterPresets(code) {
  const card = getLanguageCard(code);
  if (!card || !card.registers) return [];

  const defaultKey = card.formality?.default || Object.keys(card.registers)[0];

  return Object.entries(card.registers).map(([key, preset]) => ({
    key,
    label: preset.label,
    description: preset.description,
    prompt: preset.prompt,
    isDefault: key === defaultKey,
  }));
}

/**
 * Get structured formality metadata for a locale.
 *
 * Used by DeepL and other methods that need to know the formality level
 * without parsing register text strings. Returns the default formality
 * level (e.g., 'formal', 'polite', 'neutral') or null.
 *
 * @param {string} code - Locale code
 * @param {string|null} [presetOrCustom] - Active preset name or custom text
 * @returns {{ system: string, level: string, description: string }|null}
 */
function getFormality(code, presetOrCustom) {
  const card = getLanguageCard(code);
  if (!card || !card.formality) return null;

  // Determine which preset is active
  const activeKey = (presetOrCustom && card.registers[presetOrCustom])
    ? presetOrCustom
    : card.formality.default;

  return {
    system: card.formality.system,
    level: activeKey,
    description: card.formality.description,
  };
}

/**
 * Get gender-inclusive guidance for a locale.
 *
 * Separate from register so it can be appended to any register preset
 * without duplication.
 *
 * @param {string} code - Locale code
 * @returns {string|null} Gender-inclusive guidance text, or null
 */
function getGenderGuidance(code) {
  const card = getLanguageCard(code);
  return card?.gender?.inclusiveGuidance || null;
}

/**
 * Get all loaded language codes (primary, not aliases).
 *
 * @returns {string[]} Array of primary locale codes
 */
function getAllLanguageCodes() {
  return Array.from(_cards.keys());
}

/**
 * Get method support flags for a locale.
 *
 * @param {string} code - Locale code
 * @returns {object|null} Method support flags, or null if no card
 */
function getMethodSupport(code) {
  const card = getLanguageCard(code);
  return card?.methodSupport || null;
}

// -----------------------------------------------------------------
// Reference tier — lazy-loaded enrichment data
// -----------------------------------------------------------------

/**
 * Cache for lazily loaded reference-tier data.
 * Keyed by primary locale code. Values are the parsed reference JSON
 * merged with the runtime card, or null if no reference file exists.
 * @type {Map<string, object|null>}
 */
const _referenceCache = new Map();

/**
 * Get the full language reference for a locale, including both
 * runtime fields and reference-tier enrichment data (linguisticChallenges,
 * encyclopedic, resources).
 *
 * This function is LAZY — the reference JSON file is read from disk
 * on the first call for each language and cached thereafter. Use this
 * for dev tools, the evaluation harness, and documentation generators.
 * Do NOT use it in the hot translation path.
 *
 * @param {string} code - Locale code (e.g., 'fr', 'ko')
 * @returns {object|null} Merged runtime + reference card, or null if no card
 */
function getLanguageReference(code) {
  const runtimeCard = getLanguageCard(code);
  if (!runtimeCard) return null;

  const resolvedCode = runtimeCard.code;

  // Return cached if available
  if (_referenceCache.has(resolvedCode)) {
    return _referenceCache.get(resolvedCode);
  }

  // Attempt to load reference file from disk
  const refPath = path.join(REFERENCE_DIR, `${resolvedCode}.json`);
  let referenceData = null;

  try {
    if (fs.existsSync(refPath)) {
      const raw = fs.readFileSync(refPath, 'utf-8');
      referenceData = JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[WARN] Failed to load reference for '${resolvedCode}': ${err.message}`);
  }

  // Merge runtime + reference into a single object
  const merged = referenceData
    ? { ...runtimeCard, ...referenceData }
    : runtimeCard;

  _referenceCache.set(resolvedCode, merged);
  return merged;
}

// -----------------------------------------------------------------
// Backward-compatible DEFAULT_REGISTERS proxy
// -----------------------------------------------------------------

/**
 * Backward-compatible DEFAULT_REGISTERS export.
 *
 * Returns the same shape as the old flat dictionary so all 21 consumer
 * call sites keep working during migration:
 *   { name: string, register: string, dir?: string, scripts?: string }
 *
 * New code should use getLanguageCard() and getRegister() instead.
 *
 * WHY a Proxy: We don't want to maintain two data sources. The proxy
 * dynamically builds the old shape from the language card data on access.
 * The `ownKeys` trap ensures Object.keys(), Object.entries(), and
 * for...in loops work correctly.
 */
const DEFAULT_REGISTERS = new Proxy({}, {
  get(_target, code) {
    if (typeof code !== 'string') return undefined;

    // Handle common Proxy/inspection traps
    if (code === Symbol.toPrimitive || code === Symbol.iterator) return undefined;
    if (code === 'toJSON') {
      // Support JSON.stringify(DEFAULT_REGISTERS)
      return () => {
        const result = {};
        for (const key of _cards.keys()) {
          result[key] = DEFAULT_REGISTERS[key];
        }
        // Also include aliases that map to different keys for backward compat
        // The old code had 'no' as a direct entry, now it's an alias to 'nb'
        return result;
      };
    }

    const card = getLanguageCard(code);
    if (!card) return undefined;

    const defaultRegister = getRegister(code);
    const entry = {
      name: card.name,
      register: defaultRegister,
    };

    // Only include dir if RTL (matches old behavior — LTR was implied)
    if (card.dir === 'rtl') {
      entry.dir = 'rtl';
    }

    // Map scriptConverter to the old 'scripts' field name
    if (card.scriptConverter) {
      entry.scripts = card.scriptConverter;
    }

    return entry;
  },

  has(_target, code) {
    if (typeof code !== 'string') return false;
    return getLanguageCard(code) !== null;
  },

  ownKeys() {
    // Return all primary codes + aliases for full backward compat
    // The old code had 'no' as a key, now it's an alias to 'nb'
    const keys = [..._cards.keys()];
    for (const [alias] of _aliases) {
      if (!keys.includes(alias)) {
        keys.push(alias);
      }
    }
    return keys;
  },

  getOwnPropertyDescriptor(_target, code) {
    if (typeof code !== 'string') return undefined;
    const card = getLanguageCard(code);
    if (!card) return undefined;
    return {
      configurable: true,
      enumerable: true,
      value: DEFAULT_REGISTERS[code],
    };
  },
});

// -----------------------------------------------------------------
// Exports
// -----------------------------------------------------------------

export {
  // New API — use these in new code
  getLanguageCard,
  getLanguageReference,
  getRegister,
  getRegisterPresets,
  getFormality,
  getGenderGuidance,
  getAllLanguageCodes,
  getMethodSupport,
  resolveCode,
  DEFAULT_REGISTER_FALLBACK,

  // Backward-compatible export — existing consumers use this
  DEFAULT_REGISTERS,

  // Internal — for testing
  CARDS_DIR,
  REFERENCE_DIR,
};
