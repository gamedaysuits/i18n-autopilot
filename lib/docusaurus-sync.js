/**
 * docusaurus-sync.js — Docusaurus-specific sync operation
 *
 * Extracted from sync.js to reduce god-module complexity.
 * Handles directory-per-locale JSON + Markdown translation for
 * Docusaurus projects. Two phases:
 *
 *   Phase 1: JSON UI strings — {message, description} files in i18n/{locale}/
 *   Phase 2: Markdown content — docs/ and blog/ mirrored into i18n/{locale}/
 *
 * Reuses the shared translation pipeline (lib/translate-pair.js) for
 * the TM→API→gate sequence, and Docusaurus-specific format helpers
 * (extractDocusaurusMessages, injectDocusaurusMessages) for round-trip.
 * Does NOT modify or share state with the main runSync() path.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { translateBatch, isUnsafeKey } from './translate.js';
import { diffLocale, diffLabel } from './diff.js';
import { isPathContained } from './security.js';
import {
  extractDocusaurusMessages, injectDocusaurusMessages,
  extractDocusaurusDescriptions,
} from './format.js';
import {
  parseContentFile, protectBlocks, restoreBlocks, hasOrphanedPlaceholders,
  buildContentPrompt, reassembleContentFile, DEFAULT_TRANSLATABLE_FIELDS,
  discoverDocusaurusContentFiles, getDocusaurusTargetPath,
} from './content.js';
import { translateRawContent } from './translate.js';
import { DEFAULT_REGISTERS } from './registers.js';
import { pMap } from './concurrent.js';
import { loadTM, saveTM, tmSize } from './tm.js';
import { CONTENT_LOCK_FILENAME } from './content-sync.js';
import { output } from './output.js';
import { translateAndValidate } from './translate-pair.js';


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
 * @param {Function} resolveRuntime - Injected from sync.js to avoid circular imports
 */
async function runDocusaurusSync(options, config, cwd, resolveRuntime) {
  const { dryRun = false, audit = false, cliArgs = {} } = options;
  const forceContent = cliArgs['force-content'] || false;

  // Wire CLI --concurrency into config so the content loop can pick it up
  if (cliArgs.concurrency) {
    config.concurrency = parseInt(cliArgs.concurrency, 10) || 48;
  }

  // --force-content: delete the content lock file to force re-translation
  // of all content files, regardless of hash. Useful for retrying after
  // failed translations or when source content has changed outside rosetta.
  if (forceContent) {
    const contentLockPath = path.join(cwd, CONTENT_LOCK_FILENAME);
    if (fs.existsSync(contentLockPath)) {
      fs.unlinkSync(contentLockPath);
      output.info('Cleared content lock file — all content will be re-translated.');
    }
  }

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

  // Thread dryRun/audit into cliArgs so the preflight check can skip
  // when appropriate — same pattern as the main sync path in sync.js
  const { apiKey, pairEntries } = resolveRuntime(config, cwd, { ...cliArgs, dryRun, audit });

  if (pairEntries.length === 0) {
    output.info('No target languages configured. Add pairs to i18n-rosetta.config.json.');
    return;
  }

  output.raw(`\n  🦕 Docusaurus sync — ${pairEntries.length} language(s)`);
  output.raw(`  Source: i18n/${inputLocale}/`);
  if (dryRun) output.raw('  Mode: DRY RUN\n');
  else output.raw('');

  // ── Phase 1: JSON UI strings ──────────────────────────────────

  const sourceJSONFiles = discoverDocusaurusJSONFiles(sourceLocaleDir);
  output.raw(`  Phase 1: JSON strings (${sourceJSONFiles.length} file(s))\n`);

  let totalJSONKeys = 0;

  // Load Translation Memory for the Docusaurus path too.
  // --no-tm bypasses the cache entirely (see standard sync path for details).
  const noTM = cliArgs['no-tm'] || false;
  const tm = noTM ? { _meta: { version: 1 } } : loadTM(cwd);
  const tmInitialSize = tmSize(tm);
  if (noTM) {
    output.info('Translation Memory disabled (--no-tm)');
  } else if (tmInitialSize > 0) {
    output.info(`[TM] ${tmInitialSize} cached entries loaded`);
  }

  for (const sourceFilePath of sourceJSONFiles) {
    const relPath = path.relative(sourceLocaleDir, sourceFilePath);
    const sourceRaw = JSON.parse(fs.readFileSync(sourceFilePath, 'utf-8'));
    const sourceFlat = extractDocusaurusMessages(sourceRaw);

    // Extract developer-written context descriptions from Docusaurus format.
    // These help the LLM disambiguate polysemous terms (e.g., "Post" as
    // "submit" vs "blog post") by injecting the description alongside each key.
    const descriptions = extractDocusaurusDescriptions(sourceRaw);
    const keyCount = Object.keys(sourceFlat).length;

    // Defense: remove unsafe keys
    for (const key of Object.keys(sourceFlat)) {
      if (isUnsafeKey(key)) delete sourceFlat[key];
    }

    // ── Parallel locale processing for this JSON file ───────────
    // Each locale writes to its own target file, so zero data deps.
    const jsonConcurrency = config.jsonConcurrency || 200;

    const pairResults = await pMap(pairEntries, async ([pairKey, pairConfig]) => {
      const code = pairConfig.target;
      const targetFilePath = path.join(config.localesDir, code, relPath);

      // Security: verify target path stays within i18n directory
      if (!isPathContained(targetFilePath, config.localesDir)) {
        output.error(`${code}/${relPath} — refusing to write outside i18n directory`);
        return { keys: 0 };
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
        return { keys: 0 };
      }

      let keysProcessed = 0;

      if (diff.toProcess.length > 0) {
        output.info(`${code}/${relPath} — ${diffLabel(diff)}`);

        if (!dryRun) {
          let translated = null;
          const stringKeys = diff.toProcess.filter(k => typeof sourceFlat[k] === 'string');

          if (stringKeys.length > 0) {
            // Shared pipeline: TM partition → API call → TM store → quality gate
            const result = await translateAndValidate(stringKeys, sourceFlat, pairConfig, pairKey, {
              apiKey, tm, targetCode: code, descriptions,
            });
            translated = result.translated;

            if (translated) {
              output.progress(result.failures.length > 0 ? ` [OK] (${result.failures.length} failed gate)\n` : ' [OK]\n');
            } else if (result.apiReturnedNull || (result.failures.length > 0 && !translated)) {
              output.progress(result.apiReturnedNull ? ' [ERR] translation failed\n' : ' [ERR] all failed quality gate\n');
              output.error(`${code}/${relPath}: Translation failed. Check API key and method configuration.`);
              return { keys: 0 };
            }
          }

          // Build the translated flat map (merge existing + new translations)
          const mergedFlat = { ...existingFlat };
          for (const key of diff.toProcess) {
            if (translated && key in translated) {
              mergedFlat[key] = translated[key];
            } else if (typeof sourceFlat[key] === 'string') {
              output.warn(`${code}/${relPath}: key "${key}" not translated — skipping`);
            } else {
              mergedFlat[key] = sourceFlat[key];
            }
          }

          keysProcessed = diff.toProcess.length;

          // Inject back into Docusaurus format and write
          const docuOutput = injectDocusaurusMessages(sourceRaw, mergedFlat);
          fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
          fs.writeFileSync(targetFilePath, JSON.stringify(docuOutput, null, 2) + '\n', 'utf-8');
        } else {
          keysProcessed = diff.toProcess.length;
        }
      }

      if (diff.extra.length > 0) {
        output.warn(`${code}/${relPath} — ${diff.extra.length} extra key(s)`);
      }

      return { keys: keysProcessed };
    }, { concurrency: jsonConcurrency });

    // Aggregate results for this JSON file
    for (const r of pairResults) {
      totalJSONKeys += r.keys;
    }
  }

  if (totalJSONKeys > 0) {
    const action = dryRun ? 'Would process' : 'Synced';
    output.ok(`${action} ${totalJSONKeys} JSON key(s)`);
  } else {
    output.ok('All JSON files fully synced');
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
    output.info('No docs/ or blog/ directories found — skipping content sync.');
  } else {
    let totalContent = 0;
    let totalContentRetranslated = 0;
    let totalContentSkipped = 0;

    // Load content hash manifest for change detection (shared with Hugo content sync)
    const contentLockPath = path.join(cwd, CONTENT_LOCK_FILENAME);
    let docuContentManifest = {};
    if (fs.existsSync(contentLockPath)) {
      try { docuContentManifest = JSON.parse(fs.readFileSync(contentLockPath, 'utf-8')); } catch { /* first run */ }
    }
    const updatedDocuManifest = { ...docuContentManifest };


    // Concurrency for parallel content translation. Configurable via
    // --content-concurrency flag or config.contentConcurrency, defaults to 48.
    // Content calls are heavier (full markdown docs) so lower concurrency
    // than JSON (which defaults to 50) to avoid overwhelming the API.
    const concurrency = config.contentConcurrency || 48;

    // ── Build flat work-item pool ────────────────────────────────────
    // Pre-scan all (file × locale) combinations, check hashes, and
    // collect only the items that actually need translation. This
    // separates the cheap "what needs work?" scan from the expensive
    // "do the translation" phase, enabling a single flat pMap over
    // all work items with maximum parallelism.

    const workItems = [];
    const sourceCache = new Map(); // sourcePath → { raw, hash }

    for (const { dir: sourceContentDir, plugin: pluginName } of contentSources) {
      const sourceFiles = discoverDocusaurusContentFiles(sourceContentDir);
      const dirName = path.basename(sourceContentDir);

      for (const sourcePath of sourceFiles) {
        const relPath = path.relative(sourceContentDir, sourcePath);

        // Read and cache source file once per source path
        if (!sourceCache.has(sourcePath)) {
          const raw = fs.readFileSync(sourcePath, 'utf-8');
          const hash = crypto.createHash('sha256').update(raw, 'utf-8').digest('hex');
          sourceCache.set(sourcePath, { raw, hash });
        }
        const { raw, hash } = sourceCache.get(sourcePath);

        for (const [, pairConfig] of pairEntries) {
          const code = pairConfig.target;
          const targetPath = getDocusaurusTargetPath(
            sourcePath, sourceContentDir, code, config.localesDir, pluginName
          );

          // Security: verify target stays within i18n directory
          if (!isPathContained(targetPath, config.localesDir)) {
            continue;
          }

          const manifestKey = `docusaurus:${dirName}/${relPath}:${code}`;
          let action = 'new'; // 'new' | 'changed' | 're-translate'

          if (fs.existsSync(targetPath)) {
            const storedHash = docuContentManifest[manifestKey];
            if (storedHash && storedHash === hash) {
              // Source unchanged since last sync — skip
              totalContentSkipped++;
              continue;
            }
            if (storedHash && storedHash !== hash) {
              action = 'changed';
            } else if (!storedHash) {
              // No stored hash — check for [EN] fallback markers
              const existingContent = fs.readFileSync(targetPath, 'utf-8');
              const isRosettaFallback = existingContent.includes('[EN] ');
              if (!isRosettaFallback) {
                // Genuine hand-translated file — preserve it, record hash
                updatedDocuManifest[manifestKey] = hash;
                totalContentSkipped++;
                continue;
              }
              action = 're-translate';
            }
          }

          workItems.push({
            sourcePath, raw, hash, relPath, dirName,
            pairConfig, code, targetPath, manifestKey, pluginName, action,
          });
        }
      }
    }

    const totalWork = workItems.length;
    output.raw(`\n  Phase 2: content (${totalWork} translation(s) to process, ${totalContentSkipped} skipped, concurrency: ${concurrency})\n`);

    if (totalWork === 0) {
      output.ok('All content files are up to date.');
    } else {
      // ── Translate all work items in a single flat pool ──────────
      let completed = 0;
      const syncStartTime = Date.now();

      // Incremental manifest persistence — write every N completions
      // so killing the process doesn't lose all progress.
      const MANIFEST_WRITE_INTERVAL = 10;
      let manifestDirty = false;

      const writeManifestIfDirty = () => {
        if (!dryRun && manifestDirty) {
          const sorted = {};
          for (const key of Object.keys(updatedDocuManifest).sort()) {
            sorted[key] = updatedDocuManifest[key];
          }
          fs.writeFileSync(contentLockPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
          manifestDirty = false;
        }
      };

      await pMap(workItems, async (item) => {
        const {
          raw, hash, relPath, dirName, pairConfig, code,
          targetPath, manifestKey, action,
        } = item;

        try {
          if (action === 'changed') {
            totalContentRetranslated++;
          }

          if (dryRun) {
            const targetRel = path.relative(config.localesDir, targetPath);
            output.raw(`    [DRY] ${dirName}/${relPath} → ${code}`);
            totalContent++;
            return;
          }

          // Parse source
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
                const fmResult = await translateBatch(
                  Object.keys(fieldsToTranslate), fieldsToTranslate, pairConfig,
                  { apiKey, model: pairConfig.model, batchSize: pairConfig.batchSize || 30 },
                );
                if (fmResult) {
                  Object.assign(translatedFields, fmResult);
                } else {
                  // Front matter translation failed — loud error
                  throw new Error(
                    `Docusaurus content sync for ${code}: front matter translation returned no results.\n` +
                    '  Check your API key and method configuration.'
                  );
                }
              } else {
                // No API key — fail loud
                throw new Error(
                  `Docusaurus content sync for ${code}: no API key available.\n` +
                  '  Set OPENROUTER_API_KEY in .env.local to translate content.'
                );
              }
            }
          }

          // Translate body
          let translatedBody = body;
          if (body.trim()) {
            const { protectedBody, blocks } = protectBlocks(body);
            const isMdx = item.sourcePath.endsWith('.mdx');
            const commentStart = isMdx ? '{/* ' : '<!-- ';
            const commentEnd = isMdx ? ' */}' : ' -->';

            if (apiKey) {
              const prompt = buildContentPrompt(protectedBody, pairConfig, {
                sourceLanguageName: DEFAULT_REGISTERS[inputLocale]?.name || inputLocale,
                promptContext: pairConfig.promptContext || null,
              });
              const bodyResult = await translateRawContent(prompt, { apiKey, pairConfig });

              if (bodyResult) {
                translatedBody = restoreBlocks(bodyResult, blocks);
                if (hasOrphanedPlaceholders(translatedBody)) {
                  throw new Error(
                    `Docusaurus body for ${code}: placeholder corruption detected.\n` +
                    '  Code blocks were corrupted during translation.'
                  );
                }
              } else {
                throw new Error(
                  `Docusaurus body for ${code}: translation returned no results.\n` +
                  '  Check your API key and method configuration.'
                );
              }
            } else {
              // No API key — fail loud
              throw new Error(
                `Docusaurus body translation for ${code}: no API key available.\n` +
                '  Set OPENROUTER_API_KEY in .env.local to translate content.'
              );
            }
          }

          // Reassemble and write
          const contentOutput = reassembleContentFile({
            rawFrontMatter, translatedFields, translatedBody,
            hasFrontMatter, frontMatterFormat,
          });
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, contentOutput, 'utf-8');

          totalContent++;
          updatedDocuManifest[manifestKey] = hash;
          manifestDirty = true;

        } catch (contentErr) {
          output.error(`${dirName}/${relPath} → ${code} — ${contentErr.message}`);
        }

        // Progress reporting
        completed++;
        const pct = Math.round(100 * completed / totalWork);
        const elapsedMs = Date.now() - syncStartTime;
        const msPerItem = elapsedMs / completed;
        const remainingMs = msPerItem * (totalWork - completed);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const etaStr = remainingSec > 5 ? ` (~${remainingSec}s left)` : '';
        const tag = action === 're-translate' ? 'RE-TRANSLATE' : action === 'changed' ? 'CHANGED' : 'OK';
        output.raw(`    [${completed}/${totalWork}] (${pct}%) ${dirName}/${relPath} → ${code} [${tag}]${etaStr}`);

        // Incremental manifest write
        if (completed % MANIFEST_WRITE_INTERVAL === 0) {
          writeManifestIfDirty();
        }
      }, { concurrency });

      // Final manifest write
      writeManifestIfDirty();
    }

    // Also persist any skipped-file hash recordings
    if (!dryRun) {
      const sorted = {};
      for (const key of Object.keys(updatedDocuManifest).sort()) {
        sorted[key] = updatedDocuManifest[key];
      }
      fs.writeFileSync(contentLockPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
    }

    if (totalContent > 0 || totalContentSkipped > 0 || totalContentRetranslated > 0) {
      const action = dryRun ? 'Would create' : 'Created';
      const retranslateNote = totalContentRetranslated > 0 ? ` (${totalContentRetranslated} re-translated)` : '';
      output.ok(`${action} ${totalContent} content file(s)${retranslateNote}, ${totalContentSkipped} unchanged`);
    }
  }

  // Save TM if any new entries were added during this Docusaurus sync.
  // Skip when --no-tm is active.
  if (!dryRun && !noTM) {
    const tmFinalSize = tmSize(tm);
    if (tmFinalSize > tmInitialSize) {
      saveTM(cwd, tm);
      output.info(`[TM] Saved ${tmFinalSize - tmInitialSize} new entries (${tmFinalSize} total)`);
    }
  }

  output.raw('');
}

export { runDocusaurusSync };

