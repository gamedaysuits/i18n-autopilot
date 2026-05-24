/**
 * Command: tm
 *
 * Manages the Translation Memory cache (.rosetta/tm.json).
 *
 * Subcommands:
 *   stats   Show entry count, file size, locale breakdown, and timestamps.
 *   clear   Delete the TM cache (with --yes to skip confirmation, --locale to target one locale).
 *
 * WHY THIS EXISTS:
 *   TM is the primary cost-saving mechanism in rosetta — it prevents
 *   re-translating keys whose source text hasn't changed. But users
 *   need visibility into the cache (how big is it? what's cached?)
 *   and a way to reset it (switching providers, fixing a bad batch).
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { loadTM, saveTM, tmSize, TM_DIR, TM_FILENAME } from '../tm.js';
import { output } from '../output.js';

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

  if (sub === 'stats') {
    return runStats(cwd);
  }

  if (sub === 'clear') {
    return runClear(args, cwd);
  }

  output.error(`Unknown subcommand: "${sub}". Run "i18n-rosetta tm --help" for usage.`);
  return 1;
}

// -----------------------------------------------------------------
// tm stats
// -----------------------------------------------------------------

/**
 * Display TM statistics: entry count, file size, timestamps,
 * and a per-locale breakdown.
 */
function runStats(cwd) {
  const tmPath = path.join(cwd, TM_DIR, TM_FILENAME);

  if (!fs.existsSync(tmPath)) {
    output.raw('\n  Translation Memory — no cache file found');
    output.raw(`  Expected: ${tmPath}`);
    output.raw('  Run "i18n-rosetta sync" to populate the cache.\n');
    return 0;
  }

  const tm = loadTM(cwd);
  const entryCount = tmSize(tm);

  // File size
  const stat = fs.statSync(tmPath);
  const sizeStr = formatBytes(stat.size);

  // Timestamps from metadata
  const created = tm._meta?.created || 'unknown';
  const createdDate = created !== 'unknown' ? created.split('T')[0] : 'unknown';

  // Find newest entry timestamp
  let newest = null;
  let oldest = null;
  for (const [key, entry] of Object.entries(tm)) {
    if (key === '_meta') continue;
    if (entry.ts) {
      if (!newest || entry.ts > newest) newest = entry.ts;
      if (!oldest || entry.ts < oldest) oldest = entry.ts;
    }
  }
  const newestDate = newest ? newest.split('T')[0] : 'unknown';

  output.raw('\n  Translation Memory — .rosetta/tm.json\n');
  output.raw(`  Entries:      ${entryCount.toLocaleString()}`);
  output.raw(`  File size:    ${sizeStr}`);
  output.raw(`  Created:      ${createdDate}`);
  output.raw(`  Last entry:   ${newestDate}`);

  // Per-locale breakdown — only possible for entries that have the l/m fields
  // (added in the TM format enhancement). Old entries show as "unknown".
  const localeStats = {};
  let unknownCount = 0;

  for (const [key, entry] of Object.entries(tm)) {
    if (key === '_meta') continue;

    const locale = entry.l || null;
    const method = entry.m || null;

    if (!locale) {
      unknownCount++;
      continue;
    }

    if (!localeStats[locale]) {
      localeStats[locale] = { total: 0, methods: {} };
    }
    localeStats[locale].total++;

    const methodKey = method || 'unknown';
    localeStats[locale].methods[methodKey] = (localeStats[locale].methods[methodKey] || 0) + 1;
  }

  // Sort locales by entry count (descending)
  const sortedLocales = Object.entries(localeStats)
    .sort((a, b) => b[1].total - a[1].total);

  if (sortedLocales.length > 0 || unknownCount > 0) {
    output.raw('\n  By locale:');

    for (const [locale, stats] of sortedLocales) {
      const methodParts = Object.entries(stats.methods)
        .sort((a, b) => b[1] - a[1])
        .map(([m, count]) => `${m}: ${count}`);
      const methodStr = methodParts.length > 0 ? `  (${methodParts.join(', ')})` : '';
      output.raw(`    ${locale.padEnd(6)} ${String(stats.total).padStart(5)} entries${methodStr}`);
    }

    if (unknownCount > 0) {
      output.raw(`    ${'(old)'.padEnd(6)} ${String(unknownCount).padStart(5)} entries  (pre-v3.4, no locale metadata)`);
    }
  }

  output.raw('');
  return 0;
}

// -----------------------------------------------------------------
// tm clear
// -----------------------------------------------------------------

/**
 * Clear the TM cache. Supports full clear or per-locale clear.
 *
 * --yes skips the confirmation prompt.
 * --locale <code> removes only entries for that locale (requires l field).
 */
async function runClear(args, cwd) {
  const tmPath = path.join(cwd, TM_DIR, TM_FILENAME);
  const locale = args.locale || null;
  const skipConfirm = args.yes || false;

  if (!fs.existsSync(tmPath)) {
    output.raw('\n  No TM cache file found — nothing to clear.\n');
    return 0;
  }

  if (locale) {
    // Per-locale clear — remove entries matching locale, keep the rest
    return clearLocale(cwd, tmPath, locale, skipConfirm);
  }

  // Full clear — delete the file
  if (!skipConfirm) {
    const tm = loadTM(cwd);
    const count = tmSize(tm);
    const confirmed = await confirm(
      `  Delete TM cache? (${count.toLocaleString()} entries will be lost) [y/N] `
    );
    if (!confirmed) {
      output.raw('  Aborted.\n');
      return 0;
    }
  }

  fs.unlinkSync(tmPath);
  output.raw('\n  ✓ TM cache cleared (.rosetta/tm.json deleted)');
  output.raw('  Next sync will re-translate all keys.\n');
  return 0;
}

/**
 * Remove TM entries matching a specific locale.
 * Entries without the `l` field (old format) are preserved.
 */
async function clearLocale(cwd, tmPath, locale, skipConfirm) {
  const tm = loadTM(cwd);
  let removeCount = 0;

  // Count entries to remove
  for (const [key, entry] of Object.entries(tm)) {
    if (key === '_meta') continue;
    if (entry.l === locale) removeCount++;
  }

  if (removeCount === 0) {
    output.raw(`\n  No TM entries found for locale "${locale}".`);
    output.raw('  (Old entries without locale metadata cannot be filtered.)\n');
    return 0;
  }

  if (!skipConfirm) {
    const confirmed = await confirm(
      `  Remove ${removeCount} TM entries for locale "${locale}"? [y/N] `
    );
    if (!confirmed) {
      output.raw('  Aborted.\n');
      return 0;
    }
  }

  // Remove matching entries
  for (const key of Object.keys(tm)) {
    if (key === '_meta') continue;
    if (tm[key].l === locale) delete tm[key];
  }

  saveTM(cwd, tm);
  const remaining = tmSize(tm);
  output.raw(`\n  ✓ Removed ${removeCount} entries for locale "${locale}" (${remaining} remaining)\n`);
  return 0;
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/**
 * Format bytes into a human-readable string.
 * @param {number} bytes
 * @returns {string} e.g., "1.2 MB"
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Prompt for confirmation. Returns true if the user types 'y' or 'yes'.
 * Returns false for any other input (including empty / Enter).
 */
function confirm(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

function printUsage() {
  output.raw(`
  i18n-rosetta tm — Translation Memory cache management

  SUBCOMMANDS
    stats    Show entry count, file size, and locale breakdown
    clear    Delete the TM cache (--yes to skip confirmation)

  OPTIONS
    --locale <code>   Clear only entries for a specific locale
    --yes, -y         Skip confirmation prompt

  EXAMPLES
    i18n-rosetta tm stats                  # Show cache statistics
    i18n-rosetta tm clear                  # Clear entire cache (with confirmation)
    i18n-rosetta tm clear --yes            # Clear without confirmation
    i18n-rosetta tm clear --locale fr      # Clear only French entries
  `);
}

export { run };
