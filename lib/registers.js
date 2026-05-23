/**
 * Language card registry — structured language metadata and register presets.
 *
 * ARCHITECTURE (v4):
 *   This module replaces the flat DEFAULT_REGISTERS dictionary with a
 *   structured Language Card system. Each language is a complete reference
 *   document loaded from lib/data/language-cards/<code>.json.
 *
 *   Language cards contain:
 *     - Metadata: name, native name, ISO codes, script, directionality
 *     - Formality system: T-V, speech levels, keigo, particles, etc.
 *     - Register presets: named presets specific to the language's character
 *     - Method support: which translation APIs support this language
 *     - Eval datasets: which benchmarks cover this language
 *     - Script converter: reference to deterministic converters (scripts.js)
 *
 *   ADDING A NEW LANGUAGE:
 *     See docs/planning/LANGUAGE_CARD_SPEC.md for the full research and
 *     contribution process. The short version:
 *       1. Create lib/data/language-cards/<code>.json following the schema
 *       2. Research the language's formality system and write presets
 *       3. Validate against schemas/language-card.schema.json
 *       4. Add eval dataset references if available
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
 * In-memory registry of all loaded language cards.
 * Keyed by primary locale code (e.g., 'fr', 'ko', 'x-pirate').
 * @type {Map<string, object>}
 */
const _cards = new Map();

/**
 * Alias map — alternative locale codes that resolve to a primary code.
 * e.g., 'no' → 'nb', 'iw' → 'he', 'zh-CN' → 'zh', 'fil' → 'tl'
 * Built from the `aliases` field in each language card.
 * @type {Map<string, string>}
 */
const _aliases = new Map();

/**
 * Load all language card JSON files from the cards directory.
 * Called once at module initialization. Builds both the primary
 * card registry and the alias lookup table.
 */
function _loadCards() {
  if (!fs.existsSync(CARDS_DIR)) return;

  let entries;
  try {
    entries = fs.readdirSync(CARDS_DIR);
  } catch {
    return;
  }

  for (const filename of entries) {
    if (!filename.endsWith('.json')) continue;

    const filePath = path.join(CARDS_DIR, filename);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const card = JSON.parse(raw);

      if (!card.code) {
        console.error(`[WARN] Language card ${filename} missing 'code' field — skipping.`);
        continue;
      }

      _cards.set(card.code, card);

      // Register aliases
      if (Array.isArray(card.aliases)) {
        for (const alias of card.aliases) {
          _aliases.set(alias, card.code);
        }
      }
    } catch (err) {
      console.error(`[WARN] Failed to load language card ${filename}: ${err.message}`);
    }
  }
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
 * Get the full language card for a locale code.
 *
 * Follows aliases and falls back to base locale. Returns null if
 * no card exists for this language.
 *
 * @param {string} code - Locale code (e.g., 'fr', 'ko', 'no', 'fr-CA')
 * @returns {object|null} Complete language card, or null
 */
function getLanguageCard(code) {
  const resolved = resolveCode(code);
  return _cards.get(resolved) || null;
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
};
