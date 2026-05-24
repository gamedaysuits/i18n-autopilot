#!/usr/bin/env node

/**
 * enrich-cards-from-cldr.mjs — Populate `rules` blocks in language cards
 * from CLDR data (delimiters, plural rules, script-derived properties).
 *
 * This script:
 *   1. Reads all language card JSON files from lib/data/language-cards/
 *   2. Looks up CLDR locale data for each card's code
 *   3. Populates rules.typography (quotes, spaces, punctuation)
 *   4. Populates rules.capitalization (hasCase derived from script)
 *   5. Populates rules.plurals (categories from CLDR plural rules)
 *   6. Writes the enriched card back (preserving all existing fields)
 *
 * CLDR data sources:
 *   - cldr-misc-full: delimiters (quote characters per locale)
 *   - cldr-core: plural rules (cardinal plural categories per locale)
 *
 * Derived properties (no CLDR lookup needed):
 *   - usesSpaces: false for CJK scripts (Jpan, Hans, Hant, Kore) and Thai
 *   - hasCase: true for scripts with upper/lowercase (Latn, Cyrl, Grek, Armn)
 *   - punctuationSpacing: French-style thin-nbsp before :;?! for fr, fr-CA
 *
 * Usage:
 *   node scripts/enrich-cards-from-cldr.mjs           # Enrich all cards
 *   node scripts/enrich-cards-from-cldr.mjs --dry-run  # Preview without writing
 *   node scripts/enrich-cards-from-cldr.mjs --code fr   # Enrich a single card
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CARDS_DIR = path.join(PROJECT_ROOT, 'lib', 'data', 'language-cards');

// ---------------------------------------------------------------------------
// CLDR data loading
// ---------------------------------------------------------------------------

/**
 * Load CLDR delimiter data for a locale code.
 * Falls back to base language (e.g., 'fr-CA' → 'fr') if exact match not found.
 *
 * @param {string} code - Locale code from the language card
 * @returns {{ quoteStart: string, quoteEnd: string } | null}
 */
function loadCldrDelimiters(code) {
  // CLDR uses different separator conventions — try the code as-is first,
  // then try common CLDR locale mappings
  const candidates = [
    code,
    code.replace('-', '_'),   // Some CLDR locales use underscore
    code.split('-')[0],       // Base language fallback
  ];

  for (const candidate of candidates) {
    const delimPath = path.join(
      PROJECT_ROOT, 'node_modules', 'cldr-misc-full', 'main',
      candidate, 'delimiters.json'
    );
    if (fs.existsSync(delimPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(delimPath, 'utf-8'));
        const delims = data?.main?.[candidate]?.delimiters;
        if (delims) {
          return {
            quoteStart: delims.quotationStart,
            quoteEnd: delims.quotationEnd,
          };
        }
      } catch {
        // Skip malformed data
      }
    }
  }
  return null;
}

/**
 * Load CLDR plural categories for a locale code.
 * Extracts the category names (one, few, many, other, etc.) from the
 * cardinal plural rules.
 *
 * @param {string} code - Locale code
 * @returns {string[] | null} Array of plural categories, or null
 */
function loadCldrPluralCategories(code) {
  const pluralsPath = path.join(
    PROJECT_ROOT, 'node_modules', 'cldr-core',
    'supplemental', 'plurals.json'
  );

  if (!fs.existsSync(pluralsPath)) {
    console.error('[ERROR] cldr-core/supplemental/plurals.json not found.');
    return null;
  }

  const data = JSON.parse(fs.readFileSync(pluralsPath, 'utf-8'));
  const allRules = data?.supplemental?.['plurals-type-cardinal'];
  if (!allRules) return null;

  // Try exact code, then base language
  const candidates = [code, code.split('-')[0]];
  for (const c of candidates) {
    const langRules = allRules[c];
    if (langRules) {
      // Keys look like "pluralRule-count-one", "pluralRule-count-other"
      // We extract just the category name ("one", "other", etc.)
      return Object.keys(langRules)
        .map(k => k.replace('pluralRule-count-', ''))
        .sort((a, b) => {
          // Canonical order: zero, one, two, few, many, other
          const order = ['zero', 'one', 'two', 'few', 'many', 'other'];
          return order.indexOf(a) - order.indexOf(b);
        });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Derived properties — no CLDR lookup needed, these are inherent to the
// script or language and are well-established facts.
// ---------------------------------------------------------------------------

/**
 * Scripts that do not use inter-word spaces.
 * CJK languages and Thai/Lao/Khmer don't delimit words with spaces.
 */
const NO_SPACE_SCRIPTS = new Set(['Jpan', 'Hans', 'Hant', 'Kore', 'Thai', 'Laoo', 'Khmr']);

/**
 * Scripts that have an uppercase/lowercase distinction.
 * Latin, Cyrillic, Greek, Armenian, Georgian (Mkhedruli has case in some contexts),
 * Deseret, Cherokee (modern orthography).
 */
const CASED_SCRIPTS = new Set(['Latn', 'Cyrl', 'Grek', 'Armn']);

/**
 * Languages that use thin non-breaking space before double punctuation
 * (colon, semicolon, question mark, exclamation mark).
 * This is a typographic convention primarily in French.
 */
const THIN_NBSP_PUNCTUATION_LANGUAGES = new Set(['fr', 'fr-CA']);

// ---------------------------------------------------------------------------
// Card enrichment logic
// ---------------------------------------------------------------------------

/**
 * Enrich a single language card with CLDR-derived rules.
 * Only adds fields that don't already exist — never overwrites
 * human-edited data.
 *
 * @param {object} card - The language card object
 * @returns {{ card: object, changes: string[] }} Enriched card + list of changes made
 */
function enrichCard(card) {
  const changes = [];
  const code = card.code;
  const script = card.script;

  // Skip family/subfamily abstract cards — they may not have CLDR locales
  if (code?.startsWith('family-') || code?.startsWith('subfamily-')) {
    return { card, changes: ['skipped (abstract card)'] };
  }

  // Initialize rules if it doesn't exist
  if (!card.rules) {
    card.rules = {};
  }

  // -----------------------------------------------------------------------
  // 1. Typography: quotes from CLDR
  // -----------------------------------------------------------------------
  if (!card.rules.typography) {
    card.rules.typography = {};
  }

  if (!card.rules.typography.quoteStart || !card.rules.typography.quoteEnd) {
    const delims = loadCldrDelimiters(code);
    if (delims) {
      card.rules.typography.quoteStart = delims.quoteStart;
      card.rules.typography.quoteEnd = delims.quoteEnd;
      changes.push(`typography.quotes: ${delims.quoteStart}...${delims.quoteEnd}`);
    } else {
      changes.push('typography.quotes: no CLDR data found');
    }
  }

  // 2. Typography: usesSpaces (derived from script)
  if (card.rules.typography.usesSpaces === undefined && script) {
    card.rules.typography.usesSpaces = !NO_SPACE_SCRIPTS.has(script);
    changes.push(`typography.usesSpaces: ${card.rules.typography.usesSpaces}`);
  }

  // 3. Typography: punctuationSpacing (known set)
  if (!card.rules.typography.punctuationSpacing) {
    if (THIN_NBSP_PUNCTUATION_LANGUAGES.has(code)) {
      card.rules.typography.punctuationSpacing = { doublePunctuation: 'thin-nbsp' };
      changes.push('typography.punctuationSpacing: thin-nbsp');
    } else {
      card.rules.typography.punctuationSpacing = { doublePunctuation: 'none' };
      changes.push('typography.punctuationSpacing: none');
    }
  }

  // -----------------------------------------------------------------------
  // 4. Capitalization: hasCase (derived from script)
  // -----------------------------------------------------------------------
  if (!card.rules.capitalization) {
    card.rules.capitalization = {};
  }

  if (card.rules.capitalization.hasCase === undefined && script) {
    card.rules.capitalization.hasCase = CASED_SCRIPTS.has(script);
    changes.push(`capitalization.hasCase: ${card.rules.capitalization.hasCase}`);
  }

  // -----------------------------------------------------------------------
  // 5. Plurals: categories from CLDR
  // -----------------------------------------------------------------------
  if (!card.rules.plurals) {
    card.rules.plurals = {};
  }

  if (!card.rules.plurals.categories) {
    const categories = loadCldrPluralCategories(code);
    if (categories) {
      card.rules.plurals.categories = categories;
      changes.push(`plurals.categories: [${categories.join(', ')}]`);
    } else {
      changes.push('plurals.categories: no CLDR data found');
    }
  }

  return { card, changes };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const codeFilter = args.find((a, i) => args[i - 1] === '--code');

  console.log(`\n  📋 Language Card CLDR Enrichment`);
  console.log(`  ${dryRun ? '(DRY RUN — no files will be written)' : ''}\n`);

  // Scan all card files recursively
  const cardFiles = [];
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        cardFiles.push(full);
      }
    }
  }
  scan(CARDS_DIR);

  let enrichedCount = 0;
  let skippedCount = 0;

  for (const cardPath of cardFiles) {
    const card = JSON.parse(fs.readFileSync(cardPath, 'utf-8'));

    if (codeFilter && card.code !== codeFilter) {
      continue;
    }

    const { card: enriched, changes } = enrichCard(card);

    const relPath = path.relative(PROJECT_ROOT, cardPath);
    if (changes.length === 0 || (changes.length === 1 && changes[0].startsWith('skipped'))) {
      console.log(`  ⏭  ${relPath} (${card.code}) — ${changes[0] || 'no changes needed'}`);
      skippedCount++;
      continue;
    }

    console.log(`  ✅ ${relPath} (${card.code})`);
    for (const change of changes) {
      console.log(`     └─ ${change}`);
    }

    if (!dryRun) {
      fs.writeFileSync(cardPath, JSON.stringify(enriched, null, 2) + '\n', 'utf-8');
    }
    enrichedCount++;
  }

  console.log(`\n  Summary: ${enrichedCount} enriched, ${skippedCount} skipped\n`);
}

main();
