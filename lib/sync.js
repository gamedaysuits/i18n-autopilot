/**
 * Main sync orchestrator — ties together config, diff, hash, translate, and file I/O.
 *
 * This is the core "do the thing" module. It:
 *   1. Reads the source locale file (JSON, TOML, or YAML)
 *   2. Loads the hash manifest to detect changed English content
 *   3. Iterates over all target pairs (v3 pair graph)
 *   4. Diffs each one against the source (missing + fallback + changed + forced)
 *   5. Translates stale/missing keys via the pair's configured method
 *   6. Writes updated locale files
 *   7. Saves updated hash manifest
 *   8. Optionally syncs Hugo Markdown content files
 *
 * Modes:
 *   - sync:  one-shot, translate and write
 *   - dry:   report only, no writes
 *   - audit: list all [EN]-prefixed values still needing real translation
 *
 * Watch mode and content sync are handled by separate modules
 * (lib/watch.js and lib/content-sync.js respectively).
 */

import fs from 'node:fs';
import path from 'node:path';
import { flattenKeys, setNestedValue } from './flatten.js';
import { diffLocale, diffLabel } from './diff.js';
import { translateBatch, isUnsafeKey } from './translate.js';
import { resolveConfig, autoDetectLanguages } from './config.js';
import { buildHashManifest, detectChangedKeys, readManifest, writeManifest } from './hash.js';
import { detectFormatFromDir, getExtension, readLocaleFile, writeLocaleFile, extractDocusaurusMessages, injectDocusaurusMessages } from './format.js';
import { resolvePairs } from './pairs.js';
import { loadPlugins, resolvePluginForPair } from './plugins.js';
import { isPathContained } from './security.js';
import { loadApiKey } from './api-key.js';
import { runContentSync } from './content-sync.js';
import { auditProvenance } from './provenance.js';
import { validateTranslations, logGateFailures } from './validate.js';
import { convertScript, hasScriptConverter, getConverterInfo } from './scripts.js';
import {
  parseContentFile, protectBlocks, restoreBlocks, hasOrphanedPlaceholders,
  buildContentPrompt, reassembleContentFile, DEFAULT_TRANSLATABLE_FIELDS,
  discoverDocusaurusContentFiles, getDocusaurusTargetPath,
} from './content.js';
import { translateRawContent } from './translate.js';
import { DEFAULT_REGISTERS } from './registers.js';

/**
 * Resolve the translation runtime — API key, method detection, pair graph.
 *
 * Shared by runSync and runDocusaurusSync to avoid drift in the
 * setup sequence (method detection, language resolution, plugin merging).
 *
 * @param {object} config - Resolved config (post-migration, post-defaults)
 * @param {string} cwd - Working directory
 * @param {object} cliArgs - CLI flags (method, fallback, etc.)
 * @returns {{ apiKey: string|null, resolvedPairs: Map, pairEntries: Array }}
 */
function resolveRuntime(config, cwd, cliArgs = {}) {
  const apiKey = loadApiKey(config, cwd);

  // Smart method detection: if no LLM API key is available but
  // Google Translate credentials are set, auto-switch the default method.
  // This lets developers get started with just a Google Cloud API key.
  if (!apiKey && !cliArgs.method && config.defaultMethod === 'llm') {
    const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
    if (googleKey) {
      config.defaultMethod = 'google-translate';
      console.log('\n  \u2139 No OPENROUTER_API_KEY found, but GOOGLE_TRANSLATE_API_KEY is set.');
      console.log('    Auto-switching default method to google-translate.\n');
    }
  }

  // Resolve target languages — from config or auto-detect.
  let languages = config.resolvedLanguages;
  if (Object.keys(languages).length === 0) {
    languages = autoDetectLanguages(config);
    config.resolvedLanguages = languages;
  }

  // Build the pair graph — this is the v3 drivetrain.
  // Each pair carries its method, model, register, and plugin context.
  const pairs = resolvePairs(config);
  const plugins = loadPlugins(cwd);

  // Resolve plugin configs into each pair that references one.
  const resolvedPairs = new Map();
  for (const [pairKey, rawPairConfig] of pairs) {
    resolvedPairs.set(pairKey, resolvePluginForPair(plugins, rawPairConfig));
  }

  // Sort for deterministic output ordering
  const pairEntries = [...resolvedPairs.entries()].sort(([a], [b]) => a.localeCompare(b));

  return { apiKey, resolvedPairs, pairEntries };
}

/**
 * Run the main sync operation.
 *
 * @param {object} options - { dryRun, audit, cwd, cliArgs }
 */
async function runSync(options = {}) {
  const { dryRun = false, audit = false, cwd = process.cwd(), cliArgs = {} } = options;
  const config = resolveConfig(cliArgs, cwd);

  // Early dispatch: Docusaurus projects get their own sync path.
  // This keeps the entire existing sync logic untouched.
  if (config.format === 'docusaurus') {
    return runDocusaurusSync(options, config, cwd);
  }

  // Verify locales directory exists
  if (!fs.existsSync(config.localesDir)) {
    throw new Error(`Locales directory not found: ${config.localesDir}. Create it or set "localesDir" in your config file.`);
  }

  // Detect locale file format (JSON, TOML, or YAML)
  // CLI flag takes priority, then config file, then auto-detect from directory
  const format = config.format !== 'auto'
    ? config.format
    : detectFormatFromDir(config.localesDir);
  const ext = getExtension(format);

  const inputLocale = config.inputLocale;
  const sourceFile = `${inputLocale}${ext}`;
  const sourcePath = path.join(config.localesDir, sourceFile);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source locale not found: ${sourcePath}`);
  }

  // For JSON, read and flatten the nested structure.
  // For TOML/YAML, readLocaleFile already returns a flat map.
  const sourceRaw = readLocaleFile(sourcePath, format);
  const sourceFlat = format === 'json' ? flattenKeys(sourceRaw) : sourceRaw;

  // Defense-in-depth: remove any keys that could cause prototype pollution.
  // Extremely unlikely in real locale files but important for a public package.
  for (const key of Object.keys(sourceFlat)) {
    if (isUnsafeKey(key)) {
      delete sourceFlat[key];
    }
  }

  const sourceKeyCount = Object.keys(sourceFlat).length;

  // Load the hash manifest and detect which English values changed
  // since the last sync. On first run (no manifest), this returns []
  // and everything flows through the normal missing-key detection.
  const oldManifest = readManifest(cwd);
  const changedKeys = detectChangedKeys(sourceFlat, oldManifest);
  const currentManifest = buildHashManifest(sourceFlat);

  // Resolve the pair graph via the shared helper
  const { apiKey, resolvedPairs, pairEntries } = resolveRuntime(config, cwd, cliArgs);

  // Provenance check — warn about uncleared licensing before sync starts.
  // This is informational only (does not block execution).
  const provenanceAudit = auditProvenance(resolvedPairs);
  if (!provenanceAudit.allClear) {
    for (const blockedKey of provenanceAudit.blockedPairs) {
      const blockedPair = resolvedPairs.get(blockedKey);
      console.warn(`[WARN] ${blockedKey}: Method "${blockedPair.method}" has unverified licensing. Run \`i18n-rosetta provenance\` for details.`);
    }
  }

  if (pairEntries.length === 0) {
    console.log('No target languages configured. Run `i18n-rosetta init` to set up.');
    return;
  }

  // --- Audit mode ---
  if (audit) {
    console.log('Audit: scanning for untranslated values...\n');
    let total = 0;
    for (const [, pairConfig] of pairEntries) {
      const code = pairConfig.target;
      const filename = `${code}${ext}`;
      const filePath = path.join(config.localesDir, filename);
      if (!fs.existsSync(filePath)) continue;
      const dataRaw = readLocaleFile(filePath, format);
      const flat = format === 'json' ? flattenKeys(dataRaw) : dataRaw;
      const untranslated = Object.entries(flat)
        .filter(([, val]) => typeof val === 'string' && val.startsWith(config.fallbackPrefix));
      if (untranslated.length > 0) {
        console.log(`  ${filename}: ${untranslated.length} keys still need translation`);
        for (const [key] of untranslated) {
          console.log(`     - ${key}`);
        }
        total += untranslated.length;
      }
    }
    console.log(total === 0
      ? '\n  All locale files are fully translated.'
      : `\n  Total: ${total} keys need translation.`);
    return { untranslatedCount: total };
  }

  // --- Sync mode ---
  // Determine if we should use fallback mode.
  // In v3, each method manages its own API key internally.
  // The global apiKey (OPENROUTER_API_KEY) is still passed as an option
  // for backward compat — the LLM method reads it from options or env.
  const useFallback = cliArgs.fallback || false;
  const methodSummary = pairEntries.map(([, p]) => `${p.target}:${p.method}`).join(', ');
  console.log(`[INFO] Source: ${sourceFile} (${sourceKeyCount} keys)`);
  console.log(`[INFO] Pairs: ${methodSummary}`);
  if (changedKeys.length > 0) {
    console.log(`[INFO] Changed: ${changedKeys.length} key(s) have updated source content`);
  }
  if (dryRun) console.log('[INFO] Dry-run mode — no files will be modified.');

  // --- Pre-sync cost estimation ---
  // Only run cost estimation when an API key is available, because:
  //   1. Without an API key, no paid translation will occur (fallback mode),
  //      so cost estimation is meaningless
  //   2. The pricing lookup hits the OpenRouter models API (a network call),
  //      which can interfere with the Node.js test runner's process forking
  const apiKeyForCost = process.env.OPENROUTER_API_KEY;
  if (apiKeyForCost) {
    try {
      const { estimateCost } = await import('./pairs.js');
      const costEstimates = [];
      let totalEstimatedCost = 0;
      let hasUnknownCosts = false;

      for (const [pairKey, pairConfig] of pairEntries) {
        const code = pairConfig.target;
        const filename = `${code}${ext}`;
        const filePath = path.join(config.localesDir, filename);

        let targetFlat = {};
        if (fs.existsSync(filePath)) {
          const data = readLocaleFile(filePath, format);
          targetFlat = format === 'json' ? flattenKeys(data) : { ...data };
        }

        const diff = diffLocale(sourceFlat, targetFlat, config.fallbackPrefix, config.forceKeys, changedKeys);
        const keysToTranslate = diff.toProcess.filter(k => typeof sourceFlat[k] === 'string').length;

        if (keysToTranslate > 0) {
          // eslint-disable-next-line no-await-in-loop — sequential is fine for cost queries (cached)
          const estimate = await estimateCost(keysToTranslate, pairConfig);
          const costStr = estimate.estimatedCost !== null
            ? `~$${estimate.estimatedCost.toFixed(4)}`
            : 'unknown';

          if (estimate.estimatedCost !== null) {
            totalEstimatedCost += estimate.estimatedCost;
          } else {
            hasUnknownCosts = true;
          }

          costEstimates.push({
            pair: pairKey,
            method: pairConfig.method || 'llm',
            keys: keysToTranslate,
            cost: costStr,
            source: estimate.source,
          });
        }
      }

      // Display cost table if there are keys to translate
      if (costEstimates.length > 0) {
        console.log('[COST] Estimated translation cost:');
        console.log('');

        // Column headers
        const maxPair = Math.max(4, ...costEstimates.map(e => e.pair.length));
        const maxMethod = Math.max(6, ...costEstimates.map(e => e.method.length));

        console.log(`  ${'Pair'.padEnd(maxPair)}  ${'Method'.padEnd(maxMethod)}  ${'Keys'.padStart(6)}  ${'Est. Cost'.padStart(10)}`);
        console.log(`  ${'─'.repeat(maxPair)}  ${'─'.repeat(maxMethod)}  ${'─'.repeat(6)}  ${'─'.repeat(10)}`);

        for (const e of costEstimates) {
          console.log(`  ${e.pair.padEnd(maxPair)}  ${e.method.padEnd(maxMethod)}  ${String(e.keys).padStart(6)}  ${e.cost.padStart(10)}`);
        }

        const totalStr = hasUnknownCosts
          ? `~$${totalEstimatedCost.toFixed(4)}+ (some methods have unknown pricing)`
          : `~$${totalEstimatedCost.toFixed(4)}`;
        console.log(`\n  Total: ${totalStr}`);
        console.log('  Note: Estimates are approximate. Actual cost depends on string length and model pricing.');
        console.log('');
      }
    } catch (costError) {
      // Cost estimation is non-blocking — log and continue
      console.log(`[WARN] Cost estimation failed: ${costError.message}`);
    }
  }

  console.log('');

  let totalProcessed = 0;
  let totalFallback = 0;

  for (const [pairKey, pairConfig] of pairEntries) {
    const code = pairConfig.target;
    const filename = `${code}${ext}`;
    const filePath = path.join(config.localesDir, filename);

    // Security: verify the resolved write path is still within localesDir.
    // Prevents path traversal via crafted language codes like "../../../etc/passwd".
    if (!isPathContained(filePath, config.localesDir)) {
      console.error(`  [ERR] ${filename} — refusing to write outside locales directory`);
      continue;
    }

    // If locale file doesn't exist yet, create it as empty
    let data = {};
    if (fs.existsSync(filePath)) {
      data = readLocaleFile(filePath, format);
    }

    // For JSON, flatten the nested structure. TOML/YAML is already flat.
    const targetFlat = format === 'json' ? flattenKeys(data) : { ...data };
    const diff = diffLocale(sourceFlat, targetFlat, config.fallbackPrefix, config.forceKeys, changedKeys);

    if (diff.toProcess.length === 0 && diff.extra.length === 0) {
      console.log(`  [OK] ${filename} — fully synced`);
      continue;
    }

    if (diff.toProcess.length > 0) {
      console.log(`  [SYNC] ${filename} — ${diffLabel(diff)}`);

      if (!dryRun) {
        let translated = null;

        const stringKeys = diff.toProcess.filter(k => typeof sourceFlat[k] === 'string');
        if (stringKeys.length > 0) {
          // Pass the fully-resolved pairConfig to translateBatch.
          // This activates the v3 dispatch path in translate.js:
          // pairConfig.method → getMethod() → correct TranslationMethod subclass.
          process.stdout.write(`     Translating to ${pairConfig.name} (${pairConfig.method})...`);
          translated = await translateBatch(stringKeys, sourceFlat, pairConfig, {
            apiKey,
            model: pairConfig.model,
            batchSize: pairConfig.batchSize,
          });

          if (translated) {
            // Quality gate: validate translations before accepting them.
            // Catches hallucination loops, wrong-script output, length inflation,
            // and source echoes. Failed keys are excluded and logged loudly.
            const { validated, failures } = validateTranslations(translated, sourceFlat, pairConfig);
            if (failures.length > 0) {
              logGateFailures(failures, pairKey);
            }
            translated = Object.keys(validated).length > 0 ? validated : null;

            if (translated) {
              console.log(failures.length > 0
                ? ` [OK] (${failures.length} key(s) failed quality gate)`
                : ' [OK]');
            } else {
              console.log(' [ERR] all translations failed quality gate');
              if (!useFallback) {
                console.error(`  [ERR] ${pairKey}: All translations were rejected by the quality gate.`);
                console.error('        Use --fallback to write [EN]-prefixed values instead.');
                continue;
              }
              console.log(' [WARN] using fallback prefix');
            }
          } else {
            // Method returned null — provide actionable guidance based on the method
            if (!useFallback) {
              console.log(' [ERR]');
              console.error(`  [ERR] ${pairKey}: Translation method "${pairConfig.method}" returned no results.`);

              // Method-specific troubleshooting guidance
              const method = pairConfig.method;
              if (method === 'llm' || method === 'llm-coached') {
                if (!apiKey) {
                  console.error('');
                  console.error('  ┌─ Missing API Key ─────────────────────────────────────────────┐');
                  console.error('  │ The LLM method requires an OpenRouter API key.                │');
                  console.error('  │                                                                │');
                  console.error('  │ 1. Sign up at https://openrouter.ai (free tier available)      │');
                  console.error('  │ 2. Run: export OPENROUTER_API_KEY=sk-or-v1-...                │');
                  console.error('  │ 3. Or add to .env.local: OPENROUTER_API_KEY=sk-or-v1-...      │');
                  console.error('  │                                                                │');
                  console.error('  │ Alternative: use Google Translate instead (key-value only):    │');
                  console.error('  │   export GOOGLE_TRANSLATE_API_KEY=...                          │');
                  console.error('  │   i18n-rosetta sync --method google-translate                  │');
                  console.error('  └────────────────────────────────────────────────────────────────┘');
                } else {
                  console.error('        API key is set but translation failed. Check your OpenRouter dashboard for quota/billing.');
                }
              } else if (method === 'google-translate') {
                const gKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
                if (!gKey) {
                  console.error('');
                  console.error('  ┌─ Missing API Key ─────────────────────────────────────────────┐');
                  console.error('  │ Google Translate requires a Google Cloud API key.              │');
                  console.error('  │                                                                │');
                  console.error('  │ 1. Enable the Cloud Translation API in Google Cloud Console    │');
                  console.error('  │ 2. Create an API key under APIs & Services > Credentials       │');
                  console.error('  │ 3. Run: export GOOGLE_TRANSLATE_API_KEY=...                    │');
                  console.error('  │                                                                │');
                  console.error('  │ Note: Google Translate works for key-value pairs but cannot    │');
                  console.error('  │ safely translate Markdown content (no code block awareness).   │');
                  console.error('  └────────────────────────────────────────────────────────────────┘');
                } else {
                  console.error('        API key is set but translation failed. Check your Google Cloud Console for quota/billing.');
                }
              } else {
                console.error(`        Check your API key and configuration for method "${method}".`);
              }

              console.error('        Use --fallback to write [EN]-prefixed values without an API key.');
              continue;
            }
            console.log(' [WARN] using fallback prefix');
          }
        }

        // Determine if post-translation script conversion is needed.
        // The converter runs on translated values only — not on [EN]-prefixed
        // fallbacks, since converting English to Syllabics would be nonsensical.
        const targetCode = pairConfig.target;
        const useScriptConversion = hasScriptConverter(targetCode);
        if (useScriptConversion && translated && Object.keys(translated).length > 0) {
          const info = getConverterInfo(targetCode);
          console.log(`     [SCRIPT] Converting ${info.from} → ${info.to} (${Object.keys(translated).length} keys)`);
        }

        for (const key of diff.toProcess) {
          const sourceValue = sourceFlat[key];
          let value;

          if (translated && key in translated) {
            value = translated[key];

            // Post-translation script conversion: apply the deterministic
            // converter if one is registered for the target locale.
            // e.g., Plains Cree SRO → Syllabics, Serbian Latin → Cyrillic.
            if (useScriptConversion && typeof value === 'string') {
              const { converted } = convertScript(value, targetCode);
              value = converted;
            }
          } else if (typeof sourceValue === 'string') {
            // Fallback: write [EN]-prefixed value.
            // In v3, this only runs when --fallback is set or the method returned partial results.
            value = `${config.fallbackPrefix}${sourceValue}`;
          } else {
            value = sourceValue;
          }

          if (format === 'json') {
            setNestedValue(data, key, value);
          } else {
            // For TOML/YAML, data is already flat — just set the key directly
            data[key] = value;
          }
        }

        totalProcessed += diff.toProcess.length;

        // Count how many keys fell back to [EN] prefix instead of being translated.
        // A key is "fallback" if it wasn't in the translated result set.
        if (!translated) {
          totalFallback += diff.toProcess.filter(k => typeof sourceFlat[k] === 'string').length;
        } else {
          const fallbackCount = diff.toProcess.filter(k => typeof sourceFlat[k] === 'string' && !(k in translated)).length;
          totalFallback += fallbackCount;
        }
      }
    }

    if (diff.extra.length > 0) {
      console.log(`  [WARN] ${filename} — ${diff.extra.length} extra key(s) not in source`);
    }

    // Write updated file
    if (!dryRun && diff.toProcess.length > 0) {
      writeLocaleFile(filePath, data, format, format !== 'json' ? data : undefined);
    }
  }

  // Summary — distinguish translated vs. fallback so users know what actually worked
  if (totalFallback > 0 && totalFallback === totalProcessed) {
    console.log(`\n${dryRun ? '[INFO] Would have processed' : '[WARN] Processed'} ${totalProcessed} keys — ALL used [EN] fallback prefix (no translations).`);
  } else if (totalFallback > 0) {
    const reallyTranslated = totalProcessed - totalFallback;
    console.log(`\n${dryRun ? '[INFO] Would have processed' : '[OK] Synced'} ${reallyTranslated} keys, ${totalFallback} used [EN] fallback prefix.`);
  } else {
    console.log(`\n${dryRun ? '[INFO] Would have processed' : '[OK] Synced'} ${totalProcessed} keys total.`);
  }

  // Write the updated hash manifest so the next sync knows
  // what state the translations are based on.
  // Skip in dry-run mode — don't mark stale keys as resolved.
  if (!dryRun) {
    writeManifest(cwd, currentManifest);
  }

  // Content sync — translate Hugo Markdown content files if configured.
  // Uses the same resolved pair graph as key-value sync, ensuring method
  // dispatch is consistent across both translation modes.
  if (config.contentDir) {
    await runContentSync({
      contentDir: config.contentDir,
      sourceLocale: inputLocale,
      pairs: resolvedPairs,
      translatableFields: config.translatableFields,
      apiKey,
      dryRun,
    });
  }
}

// -----------------------------------------------------------------
// Docusaurus sync — handles directory-per-locale JSON + Markdown
//
// This is a self-contained sync function for Docusaurus projects.
// It reuses the core translation pipeline (diffLocale, translateBatch,
// validateTranslations) but handles:
//
//   1. Multi-file JSON with {message, description} format
//   2. Directory-mirrored Markdown content (docs/ and blog/)
//
// It does NOT modify or share state with the main runSync() path.
// -----------------------------------------------------------------

/**
 * Discover all JSON locale files in a Docusaurus i18n source directory.
 *
 * Walks the source locale directory recursively and returns all .json files.
 * These include code.json and plugin-specific files in subdirectories.
 *
 * @param {string} sourceLocaleDir - e.g., /project/i18n/en
 * @returns {string[]} Absolute paths to JSON files
 */
function discoverDocusaurusJSONFiles(sourceLocaleDir) {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  walk(sourceLocaleDir);
  return files.sort();
}

/**
 * Run the Docusaurus-specific sync operation.
 *
 * Two phases:
 *   Phase 1: JSON UI strings — {message, description} files in i18n/{locale}/
 *   Phase 2: Markdown content — docs/ and blog/ mirrored into i18n/{locale}/
 *
 * @param {object} options - { dryRun, audit, cwd, cliArgs }
 * @param {object} config - Resolved config from resolveConfig()
 * @param {string} cwd - Working directory
 */
async function runDocusaurusSync(options, config, cwd) {
  const { dryRun = false, audit = false, cliArgs = {} } = options;
  const useFallback = cliArgs.fallback || false;

  // Verify i18n directory exists
  if (!fs.existsSync(config.localesDir)) {
    throw new Error(`Docusaurus i18n directory not found: ${config.localesDir}. Run \`npx docusaurus write-translations\` first.`);
  }

  const inputLocale = config.inputLocale;
  const sourceLocaleDir = path.join(config.localesDir, inputLocale);

  if (!fs.existsSync(sourceLocaleDir)) {
    throw new Error(
      `Source locale directory not found: ${sourceLocaleDir}. ` +
      `Run \`npx docusaurus write-translations\` to generate source strings.`
    );
  }

  // Resolve the pair graph via the shared helper
  const { apiKey, pairEntries } = resolveRuntime(config, cwd, cliArgs);

  if (pairEntries.length === 0) {
    console.log('No target languages configured. Add pairs to i18n-rosetta.config.json.');
    return;
  }

  console.log(`\n  🦕 Docusaurus sync — ${pairEntries.length} language(s)`);
  console.log(`  Source: i18n/${inputLocale}/`);
  if (dryRun) console.log('  Mode: DRY RUN\n');
  else console.log('');

  // ── Phase 1: JSON UI strings ──────────────────────────────────

  const sourceJSONFiles = discoverDocusaurusJSONFiles(sourceLocaleDir);
  console.log(`  Phase 1: JSON strings (${sourceJSONFiles.length} file(s))\n`);

  let totalJSONKeys = 0;
  let totalJSONFallback = 0;

  for (const sourceFilePath of sourceJSONFiles) {
    const relPath = path.relative(sourceLocaleDir, sourceFilePath);
    const sourceRaw = JSON.parse(fs.readFileSync(sourceFilePath, 'utf-8'));
    const sourceFlat = extractDocusaurusMessages(sourceRaw);
    const keyCount = Object.keys(sourceFlat).length;

    // Defense: remove unsafe keys
    for (const key of Object.keys(sourceFlat)) {
      if (isUnsafeKey(key)) delete sourceFlat[key];
    }

    for (const [pairKey, pairConfig] of pairEntries) {
      const code = pairConfig.target;
      const targetFilePath = path.join(config.localesDir, code, relPath);

      // Security: verify target path stays within i18n directory
      if (!isPathContained(targetFilePath, config.localesDir)) {
        console.error(`    [ERR] ${code}/${relPath} — refusing to write outside i18n directory`);
        continue;
      }

      // Load existing target if present
      let existingFlat = {};
      if (fs.existsSync(targetFilePath)) {
        const existingRaw = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'));
        existingFlat = extractDocusaurusMessages(existingRaw);
      }

      // Diff against source
      const diff = diffLocale(sourceFlat, existingFlat, config.fallbackPrefix, config.forceKeys);

      if (diff.toProcess.length === 0 && diff.extra.length === 0) {
        // Fully synced — skip silently for cleaner output
        continue;
      }

      if (diff.toProcess.length > 0) {
        console.log(`    [SYNC] ${code}/${relPath} — ${diffLabel(diff)}`);

        if (!dryRun) {
          let translated = null;
          const stringKeys = diff.toProcess.filter(k => typeof sourceFlat[k] === 'string');

          if (stringKeys.length > 0) {
            process.stdout.write(`      Translating ${stringKeys.length} keys to ${pairConfig.name} (${pairConfig.method})...`);
            translated = await translateBatch(stringKeys, sourceFlat, pairConfig, {
              apiKey,
              model: pairConfig.model,
              batchSize: pairConfig.batchSize,
            });

            if (translated) {
              const { validated, failures } = validateTranslations(translated, sourceFlat, pairConfig);
              if (failures.length > 0) logGateFailures(failures, pairKey);
              translated = Object.keys(validated).length > 0 ? validated : null;
              if (translated) {
                console.log(failures.length > 0 ? ` [OK] (${failures.length} failed gate)` : ' [OK]');
              } else {
                console.log(' [ERR] all failed quality gate');
                if (!useFallback) continue;
              }
            } else {
              if (!useFallback) {
                console.log(' [ERR] translation failed');
                continue;
              }
              console.log(' [WARN] using fallback');
            }
          }

          // Build the translated flat map (merge existing + new translations + fallbacks)
          const mergedFlat = { ...existingFlat };
          for (const key of diff.toProcess) {
            if (translated && key in translated) {
              mergedFlat[key] = translated[key];
            } else if (typeof sourceFlat[key] === 'string') {
              mergedFlat[key] = `${config.fallbackPrefix}${sourceFlat[key]}`;
              totalJSONFallback++;
            } else {
              mergedFlat[key] = sourceFlat[key];
            }
          }

          totalJSONKeys += diff.toProcess.length;

          // Inject back into Docusaurus format and write
          const output = injectDocusaurusMessages(sourceRaw, mergedFlat);
          fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
          fs.writeFileSync(targetFilePath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
        } else {
          totalJSONKeys += diff.toProcess.length;
        }
      }

      if (diff.extra.length > 0) {
        console.log(`    [WARN] ${code}/${relPath} — ${diff.extra.length} extra key(s)`);
      }
    }
  }

  if (totalJSONKeys > 0) {
    const action = dryRun ? 'Would process' : 'Synced';
    const fallbackNote = totalJSONFallback > 0 ? ` (${totalJSONFallback} fallback)` : '';
    console.log(`\n  [OK] ${action} ${totalJSONKeys} JSON key(s)${fallbackNote}`);
  } else {
    console.log('\n  [OK] All JSON files fully synced');
  }

  // ── Phase 2: Markdown content (docs + blog) ───────────────────

  // Discover docs/ and blog/ directories relative to project root
  const docsDir = path.join(cwd, 'docs');
  const blogDir = path.join(cwd, 'blog');

  // Map source directories to Docusaurus plugin names
  const contentSources = [];
  if (fs.existsSync(docsDir)) {
    contentSources.push({ dir: docsDir, plugin: 'docusaurus-plugin-content-docs' });
  }
  if (fs.existsSync(blogDir)) {
    contentSources.push({ dir: blogDir, plugin: 'docusaurus-plugin-content-blog' });
  }

  if (contentSources.length === 0) {
    console.log('\n  [INFO] No docs/ or blog/ directories found — skipping content sync.');
  } else {
    let totalContent = 0;
    let totalContentFallback = 0;
    let totalContentSkipped = 0;

    for (const { dir: sourceContentDir, plugin: pluginName } of contentSources) {
      const sourceFiles = discoverDocusaurusContentFiles(sourceContentDir);
      const dirName = path.basename(sourceContentDir);
      console.log(`\n  Phase 2: ${dirName}/ content (${sourceFiles.length} file(s))\n`);

      for (const sourcePath of sourceFiles) {
        const relPath = path.relative(sourceContentDir, sourcePath);

        for (const [, pairConfig] of pairEntries) {
          const code = pairConfig.target;
          const targetPath = getDocusaurusTargetPath(
            sourcePath, sourceContentDir, code, config.localesDir, pluginName
          );

          // Security: verify target stays within i18n directory
          if (!isPathContained(targetPath, config.localesDir)) {
            console.error(`    [ERR] ${dirName}/${relPath} → ${code} — refusing to write outside i18n`);
            continue;
          }

          // Skip if target already exists
          if (fs.existsSync(targetPath)) {
            totalContentSkipped++;
            continue;
          }

          if (dryRun) {
            const targetRel = path.relative(config.localesDir, targetPath);
            console.log(`    [INFO] Would create: ${targetRel}`);
            totalContent++;
            continue;
          }

          // Read and parse the source Markdown file
          const raw = fs.readFileSync(sourcePath, 'utf-8');
          const { frontMatter, rawFrontMatter, body, hasFrontMatter, frontMatterFormat } = parseContentFile(raw);
          const fieldsList = DEFAULT_TRANSLATABLE_FIELDS;

          // Translate front matter fields
          const translatedFields = {};
          if (hasFrontMatter) {
            const fieldsToTranslate = {};
            for (const field of fieldsList) {
              if (frontMatter[field] && typeof frontMatter[field] === 'string') {
                fieldsToTranslate[field] = frontMatter[field];
              }
            }

            if (Object.keys(fieldsToTranslate).length > 0) {
              if (apiKey) {
                process.stdout.write(`    [SYNC] ${dirName}/${relPath} → ${code} front matter...`);
                const result = await translateBatch(
                  Object.keys(fieldsToTranslate), fieldsToTranslate, pairConfig,
                  { apiKey, model: pairConfig.model, batchSize: pairConfig.batchSize || 30 },
                );
                if (result) {
                  Object.assign(translatedFields, result);
                  console.log(' [OK]');
                } else {
                  for (const [field, value] of Object.entries(fieldsToTranslate)) {
                    translatedFields[field] = `[EN] ${value}`;
                  }
                  console.log(' [WARN] fallback');
                }
              } else {
                for (const field of fieldsList) {
                  if (frontMatter[field] && typeof frontMatter[field] === 'string') {
                    translatedFields[field] = `[EN] ${frontMatter[field]}`;
                  }
                }
              }
            }
          }

          // Translate body
          let translatedBody = body;
          if (body.trim()) {
            const { protectedBody, blocks } = protectBlocks(body);

            // MDX files need JSX-style comments ({/* text */}) instead of
            // HTML comments (<!-- text -->), otherwise MDX compilation fails.
            const isMdx = sourcePath.endsWith('.mdx');
            const commentStart = isMdx ? '{/* ' : '<!-- ';
            const commentEnd = isMdx ? ' */}' : ' -->';

            if (apiKey) {
              process.stdout.write(`    [SYNC] ${dirName}/${relPath} → ${code} body...`);
              const prompt = buildContentPrompt(protectedBody, pairConfig, {
                sourceLanguageName: DEFAULT_REGISTERS[inputLocale]?.name || inputLocale,
              });
              const result = await translateRawContent(prompt, { apiKey, pairConfig });

              if (result) {
                translatedBody = restoreBlocks(result, blocks);
                if (hasOrphanedPlaceholders(translatedBody)) {
                  console.log(' [ERR] placeholder corruption — keeping English');
                  translatedBody = `${commentStart}[EN] Original English content (translation had corrupted code blocks)${commentEnd}\n${body}`;
                } else {
                  console.log(' [OK]');
                }
              } else {
                translatedBody = `${commentStart}[EN] Original English content${commentEnd}\n${body}`;
                console.log(' [WARN] kept English');
              }
            } else {
              translatedBody = `${commentStart}[EN] Original English content${commentEnd}\n${body}`;
              totalContentFallback++;
            }
          }

          // Reassemble and write
          const output = reassembleContentFile({
            rawFrontMatter, translatedFields, translatedBody,
            hasFrontMatter, frontMatterFormat,
          });
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, output, 'utf-8');

          if (!apiKey) totalContentFallback++;
          else totalContent++;
        }
      }
    }

    const totalCreated = totalContent + totalContentFallback;
    if (totalCreated > 0 || totalContentSkipped > 0) {
      const action = dryRun ? 'Would create' : 'Created';
      const fallbackNote = totalContentFallback > 0 ? `, ${totalContentFallback} fallback` : '';
      console.log(`\n  [OK] ${action} ${totalCreated} content file(s)${fallbackNote}, ${totalContentSkipped} already existed`);
    }
  }

  console.log('');
}

export { runSync, runContentSync, loadApiKey };
