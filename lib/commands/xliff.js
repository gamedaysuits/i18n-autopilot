/**
 * Command: xliff
 *
 * Exports and imports XLIFF 1.2 files for professional translator review.
 *
 * Subcommands:
 *   export   Generate a .xliff file from source + target locale files.
 *   import   Merge reviewed translations from a .xliff file back into locale files.
 *
 * WHY THIS EXISTS:
 *   XLIFF is the industry-standard exchange format between translation tools
 *   and CAT (Computer-Assisted Translation) platforms. This command lets users:
 *     1. Export translations for professional review in memoQ/SDL Trados/Phrase
 *     2. Import reviewed translations back, then run sync to fill gaps
 *     3. Integrate rosetta into existing localization workflows
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveConfig } from '../config.js';
import { exportXLIFF, importXLIFF } from '../xliff.js';
import { flattenKeys, setNestedValue } from '../flatten.js';
import { readLocaleFile, detectFormatFromDir, getExtension } from '../format.js';
import { output } from '../output.js';

/** Default output directory for exported XLIFF files */
const XLIFF_DIR = '.rosetta/xliff';

/**
 * @param {import('../types.js').CLIArgs} args - Parsed CLI arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<number>} Exit code (0 = success, 1 = error)
 */
async function run(args, cwd) {
  const sub = args._[1];

  if (!sub || sub === 'help') {
    printUsage();
    return 0;
  }

  if (sub === 'export') {
    return runExport(args, cwd);
  }

  if (sub === 'import') {
    return runImport(args, cwd);
  }

  output.error(`Unknown subcommand: "${sub}". Run "i18n-rosetta xliff --help" for usage.`);
  return 1;
}

// -----------------------------------------------------------------
// xliff export
// -----------------------------------------------------------------

/**
 * Export source + target locale as XLIFF 1.2.
 *
 * Reads the source locale and the specified target locale,
 * generates XLIFF, and writes it to .rosetta/xliff/<locale>.xliff
 * (or a custom path via --out).
 */
function runExport(args, cwd) {
  const locale = args.locale;
  if (!locale) {
    output.error('Missing required --locale flag. Example: i18n-rosetta xliff export --locale fr');
    return 1;
  }

  const config = resolveConfig(args, cwd);
  const format = config.format !== 'auto'
    ? config.format
    : detectFormatFromDir(config.localesDir);
  const ext = getExtension(format);

  // Load source locale
  const sourcePath = path.join(config.localesDir, `${config.inputLocale}${ext}`);
  if (!fs.existsSync(sourcePath)) {
    output.error(`Source locale file not found: ${sourcePath}`);
    return 1;
  }
  const sourceRaw = readLocaleFile(sourcePath, format);
  const sourceFlat = format === 'json' ? flattenKeys(sourceRaw) : { ...sourceRaw };

  // Load target locale (may not exist yet — that's fine, all targets will be empty)
  const targetPath = path.join(config.localesDir, `${locale}${ext}`);
  let targetFlat = {};
  if (fs.existsSync(targetPath)) {
    const targetRaw = readLocaleFile(targetPath, format);
    targetFlat = format === 'json' ? flattenKeys(targetRaw) : { ...targetRaw };
  }

  // Generate XLIFF
  const xliff = exportXLIFF({
    sourceLocale: config.inputLocale,
    targetLocale: locale,
    sourceFlat,
    targetFlat,
    original: `${config.inputLocale}${ext}`,
  });

  // Determine output path
  const outDir = args.out || path.join(cwd, XLIFF_DIR);
  const outPath = args.out
    ? (args.out.endsWith('.xliff') ? args.out : path.join(args.out, `${locale}.xliff`))
    : path.join(outDir, `${locale}.xliff`);

  // Write
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xliff, 'utf-8');

  const keyCount = Object.keys(sourceFlat).filter(k => typeof sourceFlat[k] === 'string').length;
  const translatedCount = Object.keys(targetFlat).filter(k =>
    typeof targetFlat[k] === 'string' && targetFlat[k].length > 0
  ).length;

  output.raw(`\n  ✓ Exported XLIFF 1.2 for ${config.inputLocale} → ${locale}`);
  output.raw(`    Keys:        ${keyCount}`);
  output.raw(`    Translated:  ${translatedCount}`);
  output.raw(`    Pending:     ${keyCount - translatedCount}`);
  output.raw(`    Written to:  ${path.relative(cwd, outPath)}`);
  output.raw('');
  output.raw('  Send this file to your translator or open it in a CAT tool');
  output.raw('  (memoQ, SDL Trados, Phrase, etc.). When reviewed, import it back:');
  output.raw(`    i18n-rosetta xliff import ${path.relative(cwd, outPath)}\n`);

  return 0;
}

// -----------------------------------------------------------------
// xliff import
// -----------------------------------------------------------------

/**
 * Import reviewed translations from an XLIFF file back into the locale file.
 *
 * Reads the XLIFF, extracts target translations, and merges them
 * into the corresponding locale file. Only keys present in the
 * XLIFF are overwritten — existing translations for other keys
 * are preserved.
 */
function runImport(args, cwd) {
  const xliffPath = args._[2];
  if (!xliffPath) {
    output.error('Missing XLIFF file path. Example: i18n-rosetta xliff import .rosetta/xliff/fr.xliff');
    return 1;
  }

  const resolvedPath = path.resolve(cwd, xliffPath);
  if (!fs.existsSync(resolvedPath)) {
    output.error(`XLIFF file not found: ${resolvedPath}`);
    return 1;
  }

  const xliffContent = fs.readFileSync(resolvedPath, 'utf-8');
  const { translations, metadata } = importXLIFF(xliffContent);

  if (Object.keys(translations).length === 0) {
    output.raw('\n  No translated entries found in the XLIFF file.');
    output.raw('  Make sure the XLIFF contains <target> elements with content.\n');
    return 0;
  }

  const locale = metadata.targetLocale;
  if (!locale) {
    output.error('Could not determine target locale from XLIFF metadata.');
    output.error('The <file> element must have a target-language attribute.');
    return 1;
  }

  const config = resolveConfig(args, cwd);
  const format = config.format !== 'auto'
    ? config.format
    : detectFormatFromDir(config.localesDir);
  const ext = getExtension(format);
  const targetPath = path.join(config.localesDir, `${locale}${ext}`);

  const dryRun = args.dry || false;

  // Load existing target locale (or start fresh)
  let existingFlat = {};
  let existingRaw = {};
  if (fs.existsSync(targetPath)) {
    existingRaw = readLocaleFile(targetPath, format);
    existingFlat = format === 'json' ? flattenKeys(existingRaw) : { ...existingRaw };
  }

  // Merge: XLIFF translations overwrite existing values
  let updated = 0;
  let added = 0;
  for (const [key, value] of Object.entries(translations)) {
    if (key in existingFlat) {
      if (existingFlat[key] !== value) {
        updated++;
      }
    } else {
      added++;
    }
    existingFlat[key] = value;
  }

  const skipped = Object.keys(translations).length - updated - added;

  if (dryRun) {
    output.raw(`\n  [DRY RUN] Would import ${Object.keys(translations).length} translations for ${locale}`);
    output.raw(`    Updated:  ${updated} (changed from existing)`);
    output.raw(`    Added:    ${added} (new keys)`);
    output.raw(`    Unchanged: ${skipped}`);
    output.raw(`    Target:   ${path.relative(cwd, targetPath)}\n`);
    return 0;
  }

  // Write back
  if (format === 'json') {
    // Re-nest the flat map into JSON structure using setNestedValue
    const nested = {};
    for (const [key, value] of Object.entries(existingFlat)) {
      setNestedValue(nested, key, value);
    }
    fs.writeFileSync(targetPath, JSON.stringify(nested, null, 2) + '\n', 'utf-8');
  } else {
    // TOML/YAML — write flat
    // For now, we only support JSON import. TOML/YAML would need a format-aware writer.
    output.error(`XLIFF import for "${format}" format is not yet supported. Currently JSON only.`);
    return 1;
  }

  output.raw(`\n  ✓ Imported ${Object.keys(translations).length} translations for ${locale}`);
  output.raw(`    Updated:    ${updated} (changed from existing)`);
  output.raw(`    Added:      ${added} (new keys)`);
  output.raw(`    Unchanged:  ${skipped}`);
  output.raw(`    Written to: ${path.relative(cwd, targetPath)}\n`);

  return 0;
}

// -----------------------------------------------------------------
// Usage
// -----------------------------------------------------------------

function printUsage() {
  output.raw(`
  i18n-rosetta xliff — XLIFF 1.2 export/import for professional review

  SUBCOMMANDS
    export    Generate a .xliff file for a target locale
    import    Merge reviewed .xliff translations back into locale files

  OPTIONS
    --locale <code>   Target locale for export (required for export)
    --out <path>      Custom output path or directory (export)
    --dry             Preview import without writing files
    --config <path>   Path to config file

  WORKFLOW
    1. Export:  i18n-rosetta xliff export --locale fr
    2. Review:  Send .rosetta/xliff/fr.xliff to translator or CAT tool
    3. Import:  i18n-rosetta xliff import .rosetta/xliff/fr.xliff
    4. Sync:    i18n-rosetta sync  (fills remaining gaps)

  EXAMPLES
    i18n-rosetta xliff export --locale fr
    i18n-rosetta xliff export --locale ja --out ./review/
    i18n-rosetta xliff import .rosetta/xliff/fr.xliff
    i18n-rosetta xliff import ./reviewed.xliff --dry
  `);
}

export { run };
