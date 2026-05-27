/**
 * Main sync orchestrator — ties together config, diff, hash, translate, and file I/O.
 *
 * This is the core "do the thing" module. It:
 *   1. Prints version banner (e.g., "i18n-rosetta v3.3.1")
 *   2. Reads the source locale file (JSON, TOML, or YAML)
 *   3. Logs detected format and framework (e.g., "Detected format: json (auto)", "Detected framework: Hugo")
 *   4. Loads the hash manifest to detect changed English content
 *   5. Iterates over all target pairs (v3 pair graph)
 *   6. Diffs each one against the source (missing + fallback + changed + forced)
 *   7. Delegates translation to lib/translate-pair.js (TM → API → quality gate)
 *      with an onProgress callback wired to output.progressBar()
 *   8. Applies post-translation steps (terminology, script conversion)
 *   9. Writes updated locale files
 *  10. Saves updated hash manifest
 *  11. Delegates Docusaurus sync to lib/docusaurus-sync.js
 *  12. Delegates content sync to lib/content-sync.js
 *
 * Modes:
 *   - sync:  one-shot, translate and write
 *   - dry:   report only, no writes
 *   - audit: list all [EN]-prefixed values still needing real translation
 *
 * Related modules:
 *   - lib/translate-pair.js  — shared TM→API→gate pipeline (used by both sync paths)
 *   - lib/docusaurus-sync.js — Docusaurus JSON + Markdown sync
 *   - lib/cost-report.js     — pre-sync cost estimation display
 *   - lib/content-sync.js    — Hugo/content Markdown sync
 *   - lib/watch.js           — file watcher for auto-sync
 *   - lib/output.js          — banner(), progressBar(), and all CLI output
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { flattenKeys, setNestedValue } from './flatten.js';
import { diffLocale, diffLabel } from './diff.js';
import { isUnsafeKey, getMethod } from './translate.js';
import { resolveConfig, autoDetectLanguages } from './config.js';
import { buildHashManifest, detectChangedKeys, readManifest, writeManifest } from './hash.js';
import { detectFormatFromDir, getExtension, readLocaleFile, writeLocaleFile, detectYAMLStyle } from './format.js';
import { resolvePairs } from './pairs.js';
import { loadPlugins, resolvePluginForPair } from './plugins.js';
import { isPathContained } from './security.js';
import { loadApiKey } from './api-key.js';
import { runContentSync } from './content-sync.js';
import { auditProvenance } from './provenance.js';
import { convertScript, hasScriptConverter, getConverterInfo } from './scripts.js';
import { loadTM, saveTM, tmSize } from './tm.js';
import { verifyTerminology, logTermViolations } from './terminology.js';
import { output } from './output.js';
import { printCostEstimate } from './cost-report.js';
import { runDocusaurusSync } from './docusaurus-sync.js';
import { translateAndValidate } from './translate-pair.js';


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

  // SAFETY: shallow copy so we don't mutate the caller's config object.
  // Currently harmless (config is fresh from resolveConfig per invocation),
  // but prevents subtle bugs if anyone adds code that reads config.defaultMethod
  // or config.resolvedLanguages after resolveRuntime returns.
  const runtimeConfig = { ...config };

  // Smart method detection: if no LLM API key is available but
  // Google Translate credentials are set, auto-switch the default method.
  // This lets developers get started with just a Google Cloud API key.
  if (!apiKey && !cliArgs.method && runtimeConfig.defaultMethod === 'llm') {
    const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
    if (googleKey) {
      runtimeConfig.defaultMethod = 'google-translate';
      output.info('No OPENROUTER_API_KEY found, but GOOGLE_TRANSLATE_API_KEY is set.');
      output.info('Auto-switching default method to google-translate.');
    }
  }

  // Resolve target languages — from config or auto-detect.
  let languages = runtimeConfig.resolvedLanguages;
  if (Object.keys(languages).length === 0) {
    languages = autoDetectLanguages(runtimeConfig);
    runtimeConfig.resolvedLanguages = languages;
  }

  // Build the pair graph — this is the v3 drivetrain.
  // Each pair carries its method, model, register, and plugin context.
  const pairs = resolvePairs(runtimeConfig);
  const plugins = loadPlugins(cwd);

  // Resolve plugin configs into each pair that references one.
  const resolvedPairs = new Map();
  for (const [pairKey, rawPairConfig] of pairs) {
    resolvedPairs.set(pairKey, resolvePluginForPair(plugins, rawPairConfig));
  }

  // Sort for deterministic output ordering
  const pairEntries = [...resolvedPairs.entries()].sort(([a], [b]) => a.localeCompare(b));

  // ── PREFLIGHT READINESS CHECK ──────────────────────────────────────
  // Validate that every pair's translation method can actually execute
  // BEFORE entering the translation loop. Without this, a missing API
  // key was only discovered deep inside the loop — and for content sync,
  // it was never discovered at all (silently wrote English fallbacks).
  //
  // No gas, no ignition. If a method can't run, we fail here with
  // clear guidance instead of producing garbage 360 files later.
  // Skip preflight for dry-run (reporting only) and audit (listing fallbacks).
  // These are read-only operations that don't need an API key.
  const skipPreflight = cliArgs.fallback || cliArgs.dryRun || cliArgs.audit;
  if (!skipPreflight) {
    const failures = [];
    for (const [pairKey, pairConfig] of pairEntries) {
      const method = getMethod(pairConfig.method || 'llm', pairConfig);
      const readiness = method.checkReadiness({ apiKey, cwd });
      if (!readiness.ready) {
        failures.push({ pairKey, pairConfig, reason: readiness.reason, method });
      }
    }

    if (failures.length > 0) {
      // Build a single, actionable error with all failures + setup help.
      // Use the first failure's method for setup help (they're likely all
      // the same method with the same missing key).
      const lines = [
        '',
        '  ┌─ PREFLIGHT FAILED ──────────────────────────────────────────────┐',
        '  │ Cannot start translation — method prerequisites not met.        │',
        '  └─────────────────────────────────────────────────────────────────┘',
        '',
      ];
      for (const { pairKey, pairConfig, reason } of failures) {
        lines.push(`  ✗ ${pairKey} (method: ${pairConfig.method || 'llm'}): ${reason}`);
      }
      lines.push('');

      // Append setup help from the first failing method (most actionable)
      const helpLines = failures[0].method.getSetupHelp();
      lines.push(...helpLines);

      throw new Error(lines.join('\n'));
    }
  }

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
    return runDocusaurusSync(options, config, cwd, resolveRuntime);
  }

  // Verify locales directory exists
  if (!fs.existsSync(config.localesDir)) {
    throw new Error(`Locales directory not found: ${config.localesDir}. Create it or set "localesDir" in your config file.`);
  }

  // --- Version banner ---
  const require = createRequire(import.meta.url);
  const { version } = require('../package.json');
  output.banner(version);

  // Detect locale file format (JSON, TOML, or YAML)
  // CLI flag takes priority, then config file, then auto-detect from directory
  const isAutoFormat = config.format === 'auto';
  const format = isAutoFormat
    ? detectFormatFromDir(config.localesDir)
    : config.format;
  const ext = getExtension(format);
  output.info(`Detected format: ${format} (${isAutoFormat ? 'auto' : 'config'})`);

  // Framework detection — Hugo (contentDir) or Docusaurus (already dispatched above)
  if (config.contentDir) {
    output.info('Detected framework: Hugo');
    output.info(`Content directory: ${config.contentDir}`);
  }

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

  // Detect YAML sub-format: Hugo (CLDR plural sub-keys only) vs standard nested.
  // Read the raw file content to inspect sub-key names before they're flattened.
  const yamlStyle = format === 'yaml'
    ? detectYAMLStyle(fs.readFileSync(sourcePath, 'utf-8'))
    : null;

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

  // Resolve the pair graph via the shared helper.
  // Thread dryRun/audit into cliArgs so the preflight check can skip
  // for read-only operations that don't need an API key.
  const { apiKey, resolvedPairs, pairEntries } = resolveRuntime(config, cwd, { ...cliArgs, dryRun, audit });

  // Provenance check — warn about uncleared licensing before sync starts.
  // This is informational only (does not block execution).
  const provenanceAudit = auditProvenance(resolvedPairs);
  if (!provenanceAudit.allClear) {
    for (const blockedKey of provenanceAudit.blockedPairs) {
      const blockedPair = resolvedPairs.get(blockedKey);
      output.warn(`${blockedKey}: Method "${blockedPair.method}" has unverified licensing. Run \`i18n-rosetta provenance\` for details.`);
    }
  }

  if (pairEntries.length === 0) {
    output.info('No target languages configured. Run `i18n-rosetta init` to set up.');
    return;
  }

  // --- Audit mode ---
  if (audit) {
    output.info('Audit: scanning for untranslated values...');
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
        output.raw(`  ${filename}: ${untranslated.length} keys still need translation`);
        for (const [key] of untranslated) {
          output.raw(`     - ${key}`);
        }
        total += untranslated.length;
      }
    }
    output.raw(total === 0
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
  output.info(`Source: ${sourceFile} (${sourceKeyCount} keys)`);
  output.info(`Pairs: ${methodSummary}`);
  if (changedKeys.length > 0) {
    output.info(`Changed: ${changedKeys.length} key(s) have updated source content`);
  }
  if (dryRun) output.info('Dry-run mode — no files will be modified.');

  // --- Pre-sync cost estimation ---
  // Displays a cost table when an OPENROUTER_API_KEY is available.
  // Non-blocking — failures log a warning and allow the sync to continue.
  await printCostEstimate(pairEntries, sourceFlat, config, format, ext, changedKeys);

  output.raw('');

  // Load Translation Memory — provides same-project caching across syncs.
  // Keys whose source text + locale + method haven't changed will be served
  // from TM instead of hitting the API. This is the primary cost-saving
  // mechanism: re-running sync after a single key change only translates
  // that one key, not the entire file.
  //
  // --no-tm bypasses the cache entirely: all keys go to the API and nothing
  // is stored. Useful when switching providers or debugging translation quality.
  const noTM = cliArgs['no-tm'] || false;
  const tm = noTM ? { _meta: { version: 1 } } : loadTM(cwd);
  const tmInitialSize = tmSize(tm);
  if (noTM) {
    output.info('Translation Memory disabled (--no-tm)');
  } else if (tmInitialSize > 0) {
    output.info(`Translation Memory: ${tmInitialSize} cached entries loaded`);
  }

  let totalProcessed = 0;
  let totalFallback = 0;
  let totalTMHits = 0;

  for (const [pairKey, pairConfig] of pairEntries) {
    const code = pairConfig.target;
    const filename = `${code}${ext}`;
    const filePath = path.join(config.localesDir, filename);

    // Security: verify the resolved write path is still within localesDir.
    // Prevents path traversal via crafted language codes like "../../../etc/passwd".
    if (!isPathContained(filePath, config.localesDir)) {
      output.error(`${filename} — refusing to write outside locales directory`);
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
      output.ok(`${filename} — fully synced`);
      continue;
    }

    if (diff.toProcess.length > 0) {
      output.info(`${filename} — ${diffLabel(diff)}`);

      if (!dryRun) {
        let translated = null;

        const stringKeys = diff.toProcess.filter(k => typeof sourceFlat[k] === 'string');
        if (stringKeys.length > 0) {
          // Shared pipeline: TM partition → API call → TM store → quality gate
          const result = await translateAndValidate(stringKeys, sourceFlat, pairConfig, pairKey, {
            apiKey, tm, targetCode: code,
            onProgress: (completed, total) => {
              output.progressBar(completed, total);
            },
          });
          translated = result.translated;
          totalTMHits += result.tmHitCount;

          // Terminology enforcement: check if dictionary terms were applied.
          // This only runs when the pair has coaching data with a dictionary.
          if (translated && pairConfig.coachingData?.dictionary) {
            const { violations } = verifyTerminology(translated, sourceFlat, pairConfig.coachingData.dictionary);
            if (violations.length > 0) {
              logTermViolations(violations, pairKey);
            }
          }

          if (translated) {
            output.progress(result.failures.length > 0
              ? ` [OK] (${result.failures.length} key(s) failed quality gate)`
              : ' [OK]\n');
          } else if (result.apiReturnedNull) {
            // Method returned null — provide actionable guidance based on the method
            if (!useFallback) {
              output.progress(' [ERR]\n');
              output.error(`${pairKey}: Translation method "${pairConfig.method}" returned no results.`);

              // ⚠️  MAINTAINERS: do NOT add provider-specific help text here.
              //     Each method defines its own getSetupHelp() override.
              //     See lib/methods/base.js for the interface contract.
              const methodInstance = getMethod(pairConfig.method, pairConfig);
              const helpLines = methodInstance.getSetupHelp();
              for (const line of helpLines) {
                output.error(line);
              }

              output.error('Use --fallback to write [EN]-prefixed values without an API key.');
              continue;
            }
            output.progress(' [WARN] using fallback prefix\n');
          } else if (result.failures.length > 0 && !translated) {
            // All translations failed quality gate
            output.progress(' [ERR] all translations failed quality gate\n');
            if (!useFallback) {
              output.error(`${pairKey}: All translations were rejected by the quality gate.`);
              output.error('Use --fallback to write [EN]-prefixed values instead.');
              continue;
            }
            output.progress(' [WARN] using fallback prefix\n');
          }
        }

        // Determine if post-translation script conversion is needed.
        // The converter runs on translated values only — not on [EN]-prefixed
        // fallbacks, since converting English to Syllabics would be nonsensical.
        const targetCode = pairConfig.target;
        const useScriptConversion = hasScriptConverter(targetCode);
        if (useScriptConversion && translated && Object.keys(translated).length > 0) {
          const info = getConverterInfo(targetCode);
          output.info(`[SCRIPT] Converting ${info.from} → ${info.to} (${Object.keys(translated).length} keys)`);
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
      output.warn(`${filename} — ${diff.extra.length} extra key(s) not in source`);
    }

    // Write updated file
    if (!dryRun && diff.toProcess.length > 0) {
      writeLocaleFile(filePath, data, format, format !== 'json' ? data : undefined, yamlStyle);
    }
  }

  // Summary — distinguish translated vs. fallback so users know what actually worked
  if (totalFallback > 0 && totalFallback === totalProcessed) {
    output.warn(`${dryRun ? 'Would have processed' : 'Processed'} ${totalProcessed} keys — ALL used [EN] fallback prefix (no translations).`);
  } else if (totalFallback > 0) {
    const reallyTranslated = totalProcessed - totalFallback;
    output.ok(`${dryRun ? 'Would have processed' : 'Synced'} ${reallyTranslated} keys, ${totalFallback} used [EN] fallback prefix.`);
  } else {
    output.ok(`${dryRun ? 'Would have processed' : 'Synced'} ${totalProcessed} keys total.`);
  }

  // Write the updated hash manifest so the next sync knows
  // what state the translations are based on.
  // Skip in dry-run mode — don't mark stale keys as resolved.
  if (!dryRun) {
    writeManifest(cwd, currentManifest);

    // Persist TM if any new entries were added during this sync.
    // Skip when --no-tm is active — nothing was cached, nothing to save.
    const tmFinalSize = tmSize(tm);
    if (!noTM && tmFinalSize > tmInitialSize) {
      saveTM(cwd, tm);
      output.info(`[TM] Saved ${tmFinalSize - tmInitialSize} new entries (${tmFinalSize} total)`);
    }
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
      useFallback,
      dryRun,
      cwd,
    });
  }
}

export { runSync, runContentSync, loadApiKey };

