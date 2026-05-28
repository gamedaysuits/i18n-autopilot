/**
 * verify.js — Post-sync verification module.
 *
 * WHY: The sync pipeline can report "synced 30 keys" but some keys
 * might be wrong in fact — empty values, [EN] fallback markers from
 * prior runs, ASCII-only values for non-Latin locales, missing keys,
 * or broken ICU placeholders. This module re-reads the written locale
 * files from disk and confirms translations are actually present and
 * correct.
 *
 * DESIGN: Runs automatically at the end of every sync (unless --no-verify).
 * Also exposed as a standalone `verify` command for CI gates.
 * Reuses existing validation modules — no new check logic, just orchestration.
 *
 * PHILOSOPHY: This is a trust-but-verify gate. Sync does the work,
 * verify confirms the work is correct. Every issue is logged LOUD.
 */

import fs from 'node:fs';
import path from 'node:path';
import { readLocaleFile, detectFormatFromDir, getExtension } from './format.js';
import { flattenKeys } from './flatten.js';
import { diffLocale } from './diff.js';
import { auditLocalePair } from './integrity.js';
import { NON_LATIN_LOCALES, isAsciiOnly } from './validate.js';
import { output } from './output.js';

/**
 * Verify all target locale files against the source.
 *
 * Re-reads files from disk (not memory) to confirm what was actually
 * written. Returns a summary of errors and warnings for the caller.
 *
 * @param {object} config - Resolved config from resolveConfig()
 * @param {string} cwd - Working directory
 * @returns {Promise<{ errors: number, warnings: number }>}
 */
async function verifyLocales(config, cwd) {
  const format = config.format !== 'auto'
    ? config.format
    : detectFormatFromDir(config.localesDir);
  const ext = getExtension(format);
  const sourcePath = path.join(config.localesDir, `${config.inputLocale}${ext}`);

  if (!fs.existsSync(sourcePath)) {
    // No source file — can't verify. This shouldn't happen after a sync,
    // but don't crash the user's workflow over it.
    output.warn('[VERIFY] Source locale file not found — skipping verification.');
    return { errors: 0, warnings: 0 };
  }

  const sourceRaw = readLocaleFile(sourcePath, format);
  const sourceFlat = format === 'json' ? flattenKeys(sourceRaw) : sourceRaw;
  const sourceKeyCount = Object.keys(sourceFlat).length;

  // Detect target locales from directory listing
  const files = fs.readdirSync(config.localesDir);
  const targetLocales = files
    .filter(f => f.endsWith(ext) && !f.startsWith(config.inputLocale))
    .map(f => f.replace(ext, ''));

  if (targetLocales.length === 0) {
    return { errors: 0, warnings: 0 };
  }

  output.raw('\n  \u2500\u2500 Post-Sync Verification \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const locale of targetLocales) {
    const targetPath = path.join(config.localesDir, `${locale}${ext}`);
    if (!fs.existsSync(targetPath)) continue;

    const targetRaw = readLocaleFile(targetPath, format);
    const targetFlat = format === 'json' ? flattenKeys(targetRaw) : targetRaw;
    const targetKeyCount = Object.keys(targetFlat).length;

    const localeErrors = [];
    const localeWarnings = [];

    output.raw(`  \u2500\u2500 ${locale} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);

    // 1. Key parity — are all source keys present in target?
    const missingKeys = Object.keys(sourceFlat).filter(k => !(k in targetFlat));
    if (missingKeys.length > 0) {
      const preview = missingKeys.slice(0, 5).join(', ');
      const suffix = missingKeys.length > 5 ? '...' : '';
      localeErrors.push(`${missingKeys.length} missing key(s): ${preview}${suffix}`);
    } else {
      output.raw(`  [OK] ${targetKeyCount}/${sourceKeyCount} keys present`);
    }

    // 2. [EN] fallback marker scan — any legacy [EN]-prefixed values?
    const fallbackPrefix = config.fallbackPrefix || '[EN] ';
    const fallbackKeys = Object.keys(targetFlat).filter(k =>
      typeof targetFlat[k] === 'string' && targetFlat[k].startsWith(fallbackPrefix)
    );
    if (fallbackKeys.length > 0) {
      const preview = fallbackKeys.slice(0, 3).join(', ');
      const suffix = fallbackKeys.length > 3 ? '...' : '';
      localeErrors.push(`${fallbackKeys.length} [EN] fallback marker(s): ${preview}${suffix}`);
    } else {
      output.raw('  [OK] No [EN] fallback markers');
    }

    // 3. Empty value scan
    const emptyKeys = Object.keys(targetFlat).filter(k =>
      typeof targetFlat[k] === 'string' && targetFlat[k].trim() === ''
    );
    if (emptyKeys.length > 0) {
      const preview = emptyKeys.slice(0, 3).join(', ');
      const suffix = emptyKeys.length > 3 ? '...' : '';
      localeErrors.push(`${emptyKeys.length} empty translation(s): ${preview}${suffix}`);
    }

    // 4. Script compliance — non-Latin locales should have non-ASCII translations
    const isNonLatin = NON_LATIN_LOCALES.has(locale) || NON_LATIN_LOCALES.has(locale.split('-')[0]);
    if (isNonLatin) {
      const asciiOnlyKeys = Object.keys(targetFlat).filter(k => {
        const val = targetFlat[k];
        // Only check string values that are long enough to be real translations
        // (short values like "API", "OK", "ID" are often legitimately ASCII)
        if (typeof val !== 'string' || val.length < 6) return false;
        return isAsciiOnly(val);
      });
      if (asciiOnlyKeys.length > 0) {
        const preview = asciiOnlyKeys.slice(0, 3).join(', ');
        const suffix = asciiOnlyKeys.length > 3 ? '...' : '';
        localeErrors.push(`${asciiOnlyKeys.length} wrong script (ASCII-only): ${preview}${suffix}`);
      }
    }

    // 5. Placeholder preservation — run the integrity audit for placeholder + encoding checks
    const audit = auditLocalePair(sourceFlat, targetFlat, locale);

    if (audit.placeholderIssues.length > 0) {
      const preview = audit.placeholderIssues.slice(0, 3).map(i => i.key).join(', ');
      const suffix = audit.placeholderIssues.length > 3 ? '...' : '';
      localeErrors.push(`${audit.placeholderIssues.length} placeholder mismatch(es): ${preview}${suffix}`);
    } else {
      output.raw('  [OK] Placeholders intact');
    }

    // 6. Encoding issues
    if (audit.encodingIssues.length > 0) {
      const preview = audit.encodingIssues.slice(0, 3).map(i => i.key).join(', ');
      const suffix = audit.encodingIssues.length > 3 ? '...' : '';
      localeWarnings.push(`${audit.encodingIssues.length} encoding issue(s): ${preview}${suffix}`);
    }

    // 7. Source echo — untranslated copies (warning, not error — some are legitimate)
    if (audit.copies.length > 0) {
      const preview = audit.copies.slice(0, 5).join(', ');
      const suffix = audit.copies.length > 5 ? '...' : '';
      localeWarnings.push(`${audit.copies.length} source echo(es): ${preview}${suffix}`);
    }

    // Print errors
    for (const err of localeErrors) {
      output.error(`[VERIFY] ${locale}: ${err}`);
      totalErrors++;
    }

    // Print warnings
    for (const warn of localeWarnings) {
      output.warn(`[VERIFY] ${locale}: ${warn}`);
      totalWarnings++;
    }

    if (localeErrors.length === 0 && localeWarnings.length === 0) {
      output.raw('  [OK] All checks passed');
    }
    output.raw('');
  }

  // Summary
  if (totalErrors === 0 && totalWarnings === 0) {
    output.ok('Verification passed \u2014 all locales look good.');
  } else if (totalErrors === 0) {
    output.ok(`Verification passed with ${totalWarnings} warning(s).`);
  } else {
    output.error(`Verification: ${totalErrors} error(s), ${totalWarnings} warning(s).`);
  }

  return { errors: totalErrors, warnings: totalWarnings };
}

export { verifyLocales };
