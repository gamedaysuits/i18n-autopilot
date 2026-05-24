#!/usr/bin/env node

/**
 * generate-language-card.mjs — Card Generator for i18n-rosetta
 *
 * Creates scaffolded language cards (runtime + reference tier) from
 * authoritative data sources:
 *
 *   - IANA Subtag Registry  → BCP 47 tag, ISO codes, English name
 *   - CLDR (likelySubtags)  → Script, region, text direction
 *   - CLDR (plurals)        → Plural category rules
 *   - CLDR (delimiters)     → Typography quotes
 *   - CLDR (scriptMetadata) → Capitalization (hasCase), RTL
 *   - Glottolog (online)    → Glottocode, language family, classification
 *
 * USAGE:
 *   node scripts/generate-language-card.mjs <code> [--dry-run] [--force]
 *
 *   <code>     BCP 47 / ISO 639-1 / ISO 639-3 language code (e.g., 'ka', 'yo', 'qu')
 *   --dry-run  Print generated cards to stdout without writing files
 *   --force    Overwrite existing card files
 *
 * WHAT IT AUTO-POPULATES:
 *   ✅ code, bcp47, iso639_1, iso639_3, name
 *   ✅ script, dir (from CLDR likelySubtags + scriptMetadata)
 *   ✅ rules.typography (quoteStart/quoteEnd from CLDR delimiters)
 *   ✅ rules.capitalization (from CLDR scriptMetadata.hasCase)
 *   ✅ rules.plurals (from CLDR cardinal plural rules)
 *   ✅ methodSupport (from bundled service language lists)
 *   ✅ glottocode, encyclopedic.family (from Glottolog API)
 *
 * WHAT NEEDS HUMAN CURATION (marked as TODO):
 *   ⬜ nativeName (endonym)
 *   ⬜ formality system + register presets
 *   ⬜ gender guidance
 *   ⬜ linguisticChallenges
 *   ⬜ resources (corpora, models, NLP tools)
 *
 * The generator creates a scaffold — it handles the tedious lookups so
 * the contributor can focus on linguistic judgment calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CARDS_DIR = path.join(PROJECT_ROOT, 'lib/data/language-cards');
const REFERENCE_DIR = path.join(PROJECT_ROOT, 'lib/data/language-reference');

// ─── Data Sources ──────────────────────────────────────────────────

/** IANA subtag registry (pre-parsed JSON via npm package) */
const IANA_REGISTRY = require('language-subtag-registry/data/json/registry.json');

/** CLDR supplemental data (already installed) */
const LIKELY_SUBTAGS = require('cldr-core/supplemental/likelySubtags.json')
  .supplemental.likelySubtags;
const PLURAL_RULES = require('cldr-core/supplemental/plurals.json')
  .supplemental['plurals-type-cardinal'];
const SCRIPT_METADATA = require('cldr-core/scriptMetadata.json')
  .scriptMetadata;

// ─── Method Support Lookup Tables ──────────────────────────────────
// These are curated from the official docs of each service.
// Updated periodically — last update: 2025-05-24.
//
// Sources:
//   Google:    https://cloud.google.com/translate/docs/languages
//   DeepL:     https://developers.deepl.com/docs/resources/supported-languages
//   Microsoft: https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support
//   Libre:     https://libretranslate.com/languages

const GOOGLE_TRANSLATE_CODES = new Set([
  'af','sq','am','ar','hy','as','ay','az','bm','eu','be','bn','bho','bs','bg',
  'ca','ceb','zh','zh-TW','co','hr','cs','da','dv','doi','nl','en','eo','et',
  'ee','fil','fi','fr','fy','gl','ka','de','el','gn','gu','ht','ha','haw','he',
  'hi','hmn','hu','is','ig','ilo','id','ga','it','ja','jv','kn','kk','km','rw',
  'gom','ko','kri','ku','ky','lo','la','lv','ln','lt','lg','lb','mk','mg','ms',
  'ml','mt','mi','mr','mni-Mtei','lus','mn','my','ne','no','ny','or','om','ps',
  'fa','pl','pt','pa','qu','ro','ru','sm','sa','gd','nso','sr','st','sn','sd',
  'si','sk','sl','so','es','su','sw','sv','tl','tg','ta','tt','te','th','ti',
  'ts','tr','tk','ak','uk','ur','ug','uz','vi','cy','xh','yi','yo','zu'
]);

const DEEPL_CODES = new Set([
  'ar','bg','cs','da','de','el','en','es','et','fi','fr','hu','id','it','ja',
  'ko','lt','lv','nb','nl','pl','pt','pt-BR','pt-PT','ro','ru','sk','sl','sv',
  'tr','uk','zh'
]);

// Languages where DeepL supports formality parameter
const DEEPL_FORMALITY_CODES = new Set([
  'de','es','fr','it','ja','nl','pl','pt','pt-BR','pt-PT','ru'
]);

const MICROSOFT_CODES = new Set([
  'af','am','ar','as','az','ba','bg','bn','bo','bs','ca','cs','cy','da','de',
  'dv','el','en','es','et','eu','fa','fi','fil','fj','fo','fr','ga','gl','gu',
  'ha','he','hi','hmn','hr','hsb','ht','hu','hy','id','ig','ikt','is','it','iu',
  'ja','ka','kk','km','kmr','kn','ko','ku','ky','lo','lt','lv','lzh','mg','mi',
  'mk','ml','mn','mr','ms','mt','my','nb','ne','nl','or','otq','pa','pl','prs',
  'ps','pt','pt-PT','ro','ru','rw','sd','si','sk','sl','sm','sn','so','sq','sr',
  'st','sv','sw','ta','te','th','ti','tk','tlh','to','tr','tt','ty','ug','uk',
  'ur','uz','vi','xh','yo','yua','yue','zh','zh-TW','zu'
]);

const LIBRETRANSLATE_CODES = new Set([
  'ar','az','bg','bn','ca','cs','da','de','el','en','eo','es','et','fa','fi',
  'fr','ga','he','hi','hu','id','it','ja','ko','lt','lv','mk','ms','nb','nl',
  'pl','pt','ro','ru','sk','sl','sq','sr','sv','sw','ta','te','th','tl','tr',
  'uk','ur','vi','zh'
]);

// ─── IANA Registry Lookup ──────────────────────────────────────────

/**
 * Looks up a language code in the IANA subtag registry.
 * Returns the first matching 'language' type record.
 */
function lookupIANA(code) {
  // Try exact match first
  const exact = IANA_REGISTRY.find(
    r => r.Type === 'language' && r.Subtag === code
  );
  if (exact) return exact;

  // For region-tagged codes (e.g., 'pt-BR'), look up the base language
  const base = code.split('-')[0];
  return IANA_REGISTRY.find(
    r => r.Type === 'language' && r.Subtag === base
  ) || null;
}

/**
 * Gets the ISO 639-3 code from the IANA extlang or from the registry.
 * Falls back to null if not determinable from the IANA data alone.
 */
function getISO639_3(ianaRecord, code) {
  // Many 3-letter codes in IANA are ISO 639-3 directly
  if (code.length === 3 && !code.includes('-')) return code;

  // For 2-letter codes, we need a mapping. The IANA registry doesn't store
  // 639-3 codes directly, so we use a small curated lookup for common ones.
  // The generator will mark this as needing verification.
  const TWO_TO_THREE = {
    af: 'afr', am: 'amh', ar: 'ara', az: 'aze', be: 'bel', bg: 'bul',
    bn: 'ben', bs: 'bos', ca: 'cat', cs: 'ces', cy: 'cym', da: 'dan',
    de: 'deu', el: 'ell', en: 'eng', eo: 'epo', es: 'spa', et: 'est',
    eu: 'eus', fa: 'fas', fi: 'fin', fr: 'fra', ga: 'gle', gl: 'glg',
    gu: 'guj', ha: 'hau', he: 'heb', hi: 'hin', hr: 'hrv', ht: 'hat',
    hu: 'hun', hy: 'hye', id: 'ind', ig: 'ibo', is: 'isl', it: 'ita',
    ja: 'jpn', jv: 'jav', ka: 'kat', kk: 'kaz', km: 'khm', kn: 'kan',
    ko: 'kor', ku: 'kur', ky: 'kir', lo: 'lao', lt: 'lit', lv: 'lav',
    mg: 'mlg', mi: 'mri', mk: 'mkd', ml: 'mal', mn: 'mon', mr: 'mar',
    ms: 'msa', mt: 'mlt', my: 'mya', nb: 'nob', ne: 'nep', nl: 'nld',
    no: 'nor', ny: 'nya', or: 'ori', pa: 'pan', pl: 'pol', ps: 'pus',
    pt: 'por', qu: 'que', ro: 'ron', ru: 'rus', rw: 'kin', sd: 'snd',
    si: 'sin', sk: 'slk', sl: 'slv', sm: 'smo', sn: 'sna', so: 'som',
    sq: 'sqi', sr: 'srp', st: 'sot', su: 'sun', sv: 'swe', sw: 'swa',
    ta: 'tam', te: 'tel', tg: 'tgk', th: 'tha', ti: 'tir', tk: 'tuk',
    tl: 'tgl', tr: 'tur', tt: 'tat', ug: 'uig', uk: 'ukr', ur: 'urd',
    uz: 'uzb', vi: 'vie', xh: 'xho', yi: 'yid', yo: 'yor', zh: 'zho',
    zu: 'zul',
  };
  return TWO_TO_THREE[code.split('-')[0]] || null;
}

// ─── CLDR Lookups ──────────────────────────────────────────────────

/**
 * Resolves script and region from CLDR likelySubtags.
 * E.g., 'ka' → { script: 'Geor', region: 'GE', fullTag: 'ka-Geor-GE' }
 */
function resolveLikelySubtags(code) {
  const likely = LIKELY_SUBTAGS[code] || LIKELY_SUBTAGS[code.split('-')[0]];
  if (!likely) return { script: null, region: null, fullTag: null };

  // Parse the likely subtag result: "ka-Geor-GE"
  const parts = likely.split('-');
  // Heuristic: 4-letter part is script, 2-letter UPPERCASE part is region
  let script = null;
  let region = null;
  for (const part of parts.slice(1)) {
    if (part.length === 4 && /^[A-Z][a-z]{3}$/.test(part)) script = part;
    if (part.length === 2 && /^[A-Z]{2}$/.test(part)) region = part;
  }
  return { script, region, fullTag: likely };
}

/**
 * Gets text direction from CLDR scriptMetadata.
 */
function getDirection(scriptCode) {
  if (!scriptCode) return 'ltr';
  const meta = SCRIPT_METADATA[scriptCode];
  return meta?.rtl === 'YES' ? 'rtl' : 'ltr';
}

/**
 * Gets capitalization info from CLDR scriptMetadata.
 */
function getHasCase(scriptCode) {
  if (!scriptCode) return true;
  const meta = SCRIPT_METADATA[scriptCode];
  return meta?.hasCase === 'YES';
}

/**
 * Gets plural categories from CLDR cardinal rules.
 */
function getPluralCategories(code) {
  const baseCode = code.split('-')[0];
  const rules = PLURAL_RULES[baseCode];
  if (!rules) return ['other']; // Safe default — all languages have 'other'

  return Object.keys(rules)
    .map(key => key.replace('pluralRule-count-', ''))
    .sort((a, b) => {
      // Sort in CLDR canonical order
      const order = ['zero', 'one', 'two', 'few', 'many', 'other'];
      return order.indexOf(a) - order.indexOf(b);
    });
}

/**
 * Gets quote delimiters from CLDR (if locale data exists).
 */
function getQuoteDelimiters(code) {
  const baseCode = code.split('-')[0];
  try {
    const delimPath = path.join(
      PROJECT_ROOT,
      `node_modules/cldr-misc-full/main/${baseCode}/delimiters.json`
    );
    if (fs.existsSync(delimPath)) {
      const data = JSON.parse(fs.readFileSync(delimPath, 'utf-8'));
      const delimiters = data?.main?.[baseCode]?.delimiters;
      if (delimiters) {
        return {
          quoteStart: delimiters.quotationStart || '\u201c',
          quoteEnd: delimiters.quotationEnd || '\u201d',
        };
      }
    }
  } catch {
    // Fall through to defaults
  }
  return { quoteStart: '\u201c', quoteEnd: '\u201d' };
}

// ─── Method Support Resolution ─────────────────────────────────────

/**
 * Determines which translation APIs support this language code.
 */
function resolveMethodSupport(code) {
  const baseCode = code.split('-')[0];
  // Check both the full code and the base code against each service
  const check = (set) => set.has(code) || set.has(baseCode);

  return {
    googleTranslate: check(GOOGLE_TRANSLATE_CODES),
    deepl: check(DEEPL_CODES),
    deeplFormality: check(DEEPL_FORMALITY_CODES),
    microsoftTranslator: check(MICROSOFT_CODES),
    libreTranslate: check(LIBRETRANSLATE_CODES),
    llm: true, // LLM always supported (quality varies)
  };
}

// ─── Glottolog Lookup (Online) ─────────────────────────────────────

/**
 * Looks up a language in the Glottolog API by ISO 639-3 code.
 * Returns { glottocode, family, classification } or null.
 *
 * Uses the public Glottolog API — no API key needed.
 * Docs: https://glottolog.org/glottolog/glottologinformation
 */
async function lookupGlottolog(iso639_3) {
  if (!iso639_3) return null;

  try {
    const url = `https://glottolog.org/resource/languoid/iso/${iso639_3}.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  [GLOTTOLOG] No entry for ISO 639-3: ${iso639_3}`);
        return null;
      }
      console.warn(`  [GLOTTOLOG] HTTP ${response.status} for ${iso639_3}`);
      return null;
    }

    const data = await response.json();
    return {
      glottocode: data.id || null,
      name: data.name || null,
      family: data.classification?.[0]?.name || null,
      familyCode: data.classification?.[0]?.id || null,
      classification: (data.classification || []).map(c => c.name),
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`  [GLOTTOLOG] Timeout looking up ${iso639_3}`);
    } else {
      console.warn(`  [GLOTTOLOG] Error: ${err.message}`);
    }
    return null;
  }
}

// ─── Card Generation ───────────────────────────────────────────────

/**
 * Generates a runtime card (language-cards/<code>.json) and a
 * reference card (language-reference/<code>.json) for the given code.
 */
async function generateCards(code) {
  console.log(`\nGenerating cards for: ${code}`);
  console.log('─'.repeat(50));

  // Step 1: IANA lookup
  const iana = lookupIANA(code);
  if (!iana) {
    console.error(`  [ERROR] Code '${code}' not found in IANA subtag registry.`);
    console.error(`  Try: a valid BCP 47 / ISO 639-1 / ISO 639-3 code.`);
    process.exit(1);
  }
  const englishName = iana.Description?.[0] || 'Unknown';
  const iso639_1 = code.length === 2 && !code.includes('-') ? code : null;
  const iso639_3 = getISO639_3(iana, code);
  console.log(`  [IANA] Found: ${englishName} (${iana.Subtag})`);

  // Step 2: CLDR script + direction
  const subtags = resolveLikelySubtags(code);
  // Prefer IANA Suppress-Script, then CLDR likelySubtags
  const script = iana['Suppress-Script'] || subtags.script || 'Latn';
  const dir = getDirection(script);
  console.log(`  [CLDR] Script: ${script}, Direction: ${dir}`);

  // Step 3: CLDR typography + plurals
  const quotes = getQuoteDelimiters(code);
  const pluralCategories = getPluralCategories(code);
  const hasCase = getHasCase(script);
  console.log(`  [CLDR] Quotes: ${quotes.quoteStart}…${quotes.quoteEnd}`);
  console.log(`  [CLDR] Plurals: ${pluralCategories.join(', ')}`);
  console.log(`  [CLDR] Has case: ${hasCase}`);

  // Step 4: Method support
  const methods = resolveMethodSupport(code);
  const supportedMethods = Object.entries(methods)
    .filter(([, v]) => v)
    .map(([k]) => k);
  console.log(`  [METHODS] Supported: ${supportedMethods.join(', ')}`);

  // Step 5: Glottolog lookup (async, may timeout)
  console.log(`  [GLOTTOLOG] Looking up ISO 639-3: ${iso639_3}...`);
  const glottolog = await lookupGlottolog(iso639_3);
  if (glottolog) {
    console.log(`  [GLOTTOLOG] Glottocode: ${glottolog.glottocode}`);
    console.log(`  [GLOTTOLOG] Family: ${glottolog.family || 'unknown'}`);
    if (glottolog.classification?.length > 0) {
      console.log(`  [GLOTTOLOG] Classification: ${glottolog.classification.join(' > ')}`);
    }
  }

  // Step 6: Check for FLORES/NLLB coverage
  // NLLB uses codes like 'yor_Latn', 'kat_Geor', 'que_Latn'
  const nllbCode = iso639_3 ? `${iso639_3}_${script}` : null;
  const hasFlores = methods.googleTranslate; // rough proxy: most GT languages have FLORES
  console.log(`  [NLLB] Likely code: ${nllbCode || 'unknown'}`);

  // ── Build the Runtime Card ───────────────────────────────────────

  // Determine if the script uses spaces between words
  // CJK and Thai/Khmer/Lao/Myanmar don't use spaces
  const NO_SPACE_SCRIPTS = new Set(['Hans', 'Hant', 'Jpan', 'Thai', 'Khmr', 'Laoo', 'Mymr']);
  const usesSpaces = !NO_SPACE_SCRIPTS.has(script);

  const runtimeCard = {
    code,
    name: englishName,
    nativeName: `TODO: Add endonym for ${englishName}`,
    iso639_1,
    iso639_3,
    bcp47: subtags.fullTag || code,
    script,
    dir,
    glottocode: glottolog?.glottocode || null,
    formality: {
      system: 'TODO: Research formality system (T-V, speech-levels, register-levels, none)',
      description: `TODO: Describe how formality works in ${englishName} for a developer who doesn't speak it.`,
      default: 'professional',
    },
    gender: {
      grammatical: false, // TODO: research
      inclusiveGuidance: `TODO: Research gender-inclusive conventions for ${englishName}, or set to null.`,
    },
    registers: {
      professional: {
        label: `TODO: Professional (${englishName})`,
        description: `Standard for software UI and business communication in ${englishName}.`,
        prompt: `TODO: Write a detailed LLM prompt for professional ${englishName} translation. Include pronoun choices, register conventions, and vocabulary guidance.`,
      },
    },
    aliases: [],
    methodSupport: methods,
    scriptConverter: null,
    evalDatasets: hasFlores ? ['flores-plus-devtest'] : [],
    rules: {
      typography: {
        quoteStart: quotes.quoteStart,
        quoteEnd: quotes.quoteEnd,
        usesSpaces,
        punctuationSpacing: {
          doublePunctuation: 'none',
        },
      },
      capitalization: { hasCase },
      plurals: { categories: pluralCategories },
    },
    humanReviewed: null,
    notes: null,
  };

  // ── Build the Reference Card ─────────────────────────────────────

  const referenceCard = {
    code,
    name: englishName,
    linguisticChallenges: {
      'TODO-challenge-1': `Describe a key MT challenge for ${englishName}.`,
      'TODO-challenge-2': `Describe another MT-relevant challenge.`,
    },
    encyclopedic: {
      family: glottolog?.family || `TODO: Language family for ${englishName}`,
      ...(glottolog?.classification?.length > 1
        ? { classification: glottolog.classification.join(' > ') }
        : {}),
      demographics: {
        speakers: `TODO: Approximate speaker count for ${englishName}`,
        regions: [subtags.region || 'TODO'],
      },
    },
    resources: {
      corpora: [
        ...(nllbCode
          ? [{ name: `NLLB-200 (${nllbCode})`, type: 'nmt', url: 'https://huggingface.co/facebook/nllb-200-distilled-600M' }]
          : []),
        { name: `OPUS en-${code.split('-')[0]}`, type: 'parallel', url: `https://opus.nlpl.eu/results/en&${code.split('-')[0]}/corpus-result-table` },
      ],
      models: [],
      tools: [],
    },
  };

  return { runtime: runtimeCard, reference: referenceCard };
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const positional = args.filter(a => !a.startsWith('--'));

  const dryRun = flags.has('--dry-run');
  const force = flags.has('--force');

  if (positional.length === 0 || flags.has('--help')) {
    console.log(`
  generate-language-card.mjs — Scaffold a new language card

  USAGE:
    node scripts/generate-language-card.mjs <code> [options]

  ARGUMENTS:
    <code>       BCP 47 / ISO 639-1/3 language code (e.g., ka, yo, qu)

  OPTIONS:
    --dry-run    Print generated cards to stdout; don't write files
    --force      Overwrite existing card files
    --help       Show this help message

  EXAMPLES:
    node scripts/generate-language-card.mjs ka          # Georgian
    node scripts/generate-language-card.mjs yo --dry-run # Yoruba (preview)
    node scripts/generate-language-card.mjs qu --force   # Quechua (overwrite)

  The generator auto-populates metadata from IANA, CLDR, and Glottolog.
  Fields marked TODO need human curation — see LANGUAGE_CARD_SPEC.md.
`);
    process.exit(0);
  }

  const code = positional[0];

  // Generate both cards
  const { runtime, reference } = await generateCards(code);

  // Paths
  const runtimePath = path.join(CARDS_DIR, `${code}.json`);
  const referencePath = path.join(REFERENCE_DIR, `${code}.json`);

  if (dryRun) {
    console.log('\n═══ Runtime Card (language-cards/) ═══');
    console.log(JSON.stringify(runtime, null, 2));
    console.log('\n═══ Reference Card (language-reference/) ═══');
    console.log(JSON.stringify(reference, null, 2));
    console.log('\n[DRY RUN] No files written.');
    return;
  }

  // Check for existing files
  if (fs.existsSync(runtimePath) && !force) {
    console.error(`\n  [ERROR] Runtime card already exists: ${runtimePath}`);
    console.error(`  Use --force to overwrite, or --dry-run to preview.`);
    process.exit(1);
  }
  if (fs.existsSync(referencePath) && !force) {
    console.error(`\n  [ERROR] Reference card already exists: ${referencePath}`);
    console.error(`  Use --force to overwrite, or --dry-run to preview.`);
    process.exit(1);
  }

  // Ensure directories exist
  fs.mkdirSync(CARDS_DIR, { recursive: true });
  fs.mkdirSync(REFERENCE_DIR, { recursive: true });

  // Write files
  fs.writeFileSync(runtimePath, JSON.stringify(runtime, null, 2) + '\n', 'utf-8');
  console.log(`\n  ✅ Runtime card written:   ${path.relative(PROJECT_ROOT, runtimePath)}`);

  fs.writeFileSync(referencePath, JSON.stringify(reference, null, 2) + '\n', 'utf-8');
  console.log(`  ✅ Reference card written: ${path.relative(PROJECT_ROOT, referencePath)}`);

  // Count TODOs to remind the contributor
  const runtimeTodos = JSON.stringify(runtime).match(/TODO/g)?.length || 0;
  const referenceTodos = JSON.stringify(reference).match(/TODO/g)?.length || 0;
  console.log(`\n  ⚠  ${runtimeTodos + referenceTodos} TODO items need human curation.`);
  console.log(`  See: docs/planning/LANGUAGE_CARD_SPEC.md for guidance.`);
  console.log(`  Run: node --test test/language-reference.test.js to validate.\n`);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
