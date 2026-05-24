import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARDS_DIR = path.resolve(__dirname, '../../lib/data/language-cards');
const REFERENCE_DIR = path.resolve(__dirname, '../../lib/data/language-reference');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/languages.json');

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

function generateLanguagesJson() {
  console.log(`[i18n-rosetta] Compiling language cards from: ${CARDS_DIR}`);

  if (!fs.existsSync(CARDS_DIR)) {
    console.error(`[ERROR] Cards directory not found at: ${CARDS_DIR}`);
    process.exit(1);
  }

  // 1. Scan families and subfamilies
  const parentCards = new Map();
  const parentDirs = ['families', 'subfamilies'];
  
  for (const subDir of parentDirs) {
    const fullPath = path.join(CARDS_DIR, subDir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
            const card = JSON.parse(content);
            if (card.code) {
              parentCards.set(card.code, card);
            }
          } catch (err) {
            console.warn(`[WARN] Failed to load parent card ${file}: ${err.message}`);
          }
        }
      }
    }
  }

  // 2. Scan concrete languages directly under cardsDir
  const concreteLanguages = [];
  const entries = fs.readdirSync(CARDS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      try {
        const content = fs.readFileSync(path.join(CARDS_DIR, entry.name), 'utf-8');
        const card = JSON.parse(content);
        if (card.code) {
          concreteLanguages.push(card);
        }
      } catch (err) {
        console.warn(`[WARN] Failed to load concrete card ${entry.name}: ${err.message}`);
      }
    }
  }

  // 3. Resolve inheritance recursively
  function resolveCard(card) {
    let resolved = { ...card };
    if (card.extends) {
      const parent = parentCards.get(card.extends);
      if (parent) {
        const resolvedParent = resolveCard(parent);
        resolved = deepMerge(resolvedParent, card);
      } else {
        console.warn(`[WARN] Language card '${card.code}' extends unknown parent '${card.extends}'`);
      }
    }
    return resolved;
  }

  const resolvedLanguages = concreteLanguages.map((card) => resolveCard(card));

  // 4. Merge reference-tier data (linguisticChallenges, encyclopedic, resources)
  //    from lib/data/language-reference/ into each resolved card. The reference
  //    tier is separate for runtime memory efficiency (lazy-loaded in Node), but
  //    the website needs the full merged data for static rendering.
  if (fs.existsSync(REFERENCE_DIR)) {
    let mergedCount = 0;
    for (const lang of resolvedLanguages) {
      const refPath = path.join(REFERENCE_DIR, `${lang.code}.json`);
      if (fs.existsSync(refPath)) {
        try {
          const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
          // Merge reference fields into the resolved card
          if (refData.linguisticChallenges) lang.linguisticChallenges = refData.linguisticChallenges;
          if (refData.encyclopedic) lang.encyclopedic = deepMerge(lang.encyclopedic || {}, refData.encyclopedic);
          if (refData.resources) lang.resources = refData.resources;
          mergedCount++;
        } catch (err) {
          console.warn(`[WARN] Failed to load reference data for ${lang.code}: ${err.message}`);
        }
      }
    }
    console.log(`[i18n-rosetta] Merged reference data for ${mergedCount} / ${resolvedLanguages.length} languages`);
  }

  // Sort languages alphabetically by English name
  resolvedLanguages.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resolvedLanguages, null, 2), 'utf-8');
  console.log(`[SUCCESS] Compiled ${resolvedLanguages.length} language cards into: ${OUTPUT_FILE}`);
}

generateLanguagesJson();
