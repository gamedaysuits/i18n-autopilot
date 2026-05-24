/**
 * Dynamic language card loader utility.
 * Loads card data at runtime from the actual files using Webpack's require.context.
 * Resolves inheritance chains and merges reference metadata dynamically.
 */

// Helper to deep merge parent/abstract cards into child cards
function deepMerge(parent, child) {
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
      result[key] = deepMerge(parent[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function loadLanguages() {
  try {
    // 1. Establish contexts for cards, parent folders, and references
    const cardsContext = require.context('../../../lib/data/language-cards', false, /\.json$/);
    const referencesContext = require.context('../../../lib/data/language-reference', false, /\.json$/);
    const familiesContext = require.context('../../../lib/data/language-cards/families', false, /\.json$/);
    const subfamiliesContext = require.context('../../../lib/data/language-cards/subfamilies', false, /\.json$/);

    // 2. Load parent cards (families and subfamilies)
    const parentCards = new Map();
    familiesContext.keys().forEach((key) => {
      try {
        const card = familiesContext(key);
        if (card.code) parentCards.set(card.code, card);
      } catch (e) {
        console.warn(`[languageLoader] Failed to parse family card ${key}:`, e);
      }
    });

    subfamiliesContext.keys().forEach((key) => {
      try {
        const card = subfamiliesContext(key);
        if (card.code) parentCards.set(card.code, card);
      } catch (e) {
        console.warn(`[languageLoader] Failed to parse subfamily card ${key}:`, e);
      }
    });

    // 3. Helper to recursively resolve extends/inheritance
    const resolveCard = (card) => {
      let resolved = { ...card };
      if (card.extends) {
        const parent = parentCards.get(card.extends);
        if (parent) {
          const resolvedParent = resolveCard(parent);
          resolved = deepMerge(resolvedParent, card);
        } else {
          console.warn(`[languageLoader] Card '${card.code}' extends unknown parent '${card.extends}'`);
        }
      }
      return resolved;
    };

    // 4. Load reference data
    const references = new Map();
    referencesContext.keys().forEach((key) => {
      try {
        const ref = referencesContext(key);
        const code = key.replace('./', '').replace('.json', '');
        references.set(code, ref);
      } catch (e) {
        console.warn(`[languageLoader] Failed to parse reference file ${key}:`, e);
      }
    });

    // 5. Load and resolve all concrete language cards
    const resolvedLanguages = cardsContext.keys().map((key) => {
      const rawCard = cardsContext(key);
      const resolved = resolveCard(rawCard);
      
      // Merge reference-tier data (linguistic challenges, encyclopedic info, resources)
      const ref = references.get(resolved.code);
      if (ref) {
        if (ref.linguisticChallenges) {
          resolved.linguisticChallenges = ref.linguisticChallenges;
        }
        if (ref.encyclopedic) {
          resolved.encyclopedic = deepMerge(resolved.encyclopedic || {}, ref.encyclopedic);
        }
        if (ref.resources) {
          resolved.resources = ref.resources;
        }
      }
      return resolved;
    });

    // 6. Sort alphabetically by English name
    resolvedLanguages.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return resolvedLanguages;
  } catch (err) {
    console.error('[languageLoader] Failed to dynamically load languages:', err);
    return [];
  }
}
