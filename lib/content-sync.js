/**
 * Content sync — translates Hugo Markdown content files.
 *
 * WHY THIS EXISTS: This was extracted from sync.js to reduce the
 * god-module's line count and give content translation its own
 * testable, focused module.
 *
 * v3 PAIR GRAPH: This module now accepts the resolved pair Map
 * (from pairs.js + plugins.js) rather than the v2 `languages` object.
 * Each pair carries its method, model, register, and name — the same
 * pairConfig that the key-value sync path uses. This ensures method
 * dispatch is consistent across both key-value and content translation.
 *
 * Pipeline for each source file × target pair:
 *   1. Check if translated version already exists (skip if so)
 *   2. Parse front matter and body
 *   3. Protect code blocks, shortcodes, and HTML
 *   4. Translate front matter fields + body via pair's configured method
 *   5. Check for placeholder corruption (orphaned ⟦PROTECTED_N⟧ tokens)
 *   6. Reassemble and write the target file
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { translateBatch, translateRawContent } from './translate.js';
import { DEFAULT_REGISTERS } from './registers.js';
import { isPathContained } from './security.js';
import { pMap } from './concurrent.js';
import {
  discoverContentFiles,
  getTargetContentPath,
  parseContentFile,
  protectBlocks,
  restoreBlocks,
  hasOrphanedPlaceholders,
  buildContentPrompt,
  reassembleContentFile,
  DEFAULT_TRANSLATABLE_FIELDS,
} from './content.js';

/**
 * Run content sync — translate Hugo Markdown content files.
 *
 * @param {object} options
 * @param {string} options.contentDir - Path to Hugo content directory
 * @param {string} options.sourceLocale - Source language code
 * @param {Map<string, object>} options.pairs - Resolved pair graph (pairKey → pairConfig)
 * @param {string[]|null} options.translatableFields - Front matter fields to translate
 * @param {string|null} options.apiKey - OpenRouter API key (fallback for LLM methods)
 * @param {boolean} options.dryRun - Whether to write files
 */
async function runContentSync(options) {
  const {
    contentDir,
    sourceLocale,
    pairs,
    translatableFields,
    apiKey,
    dryRun = false,
    cwd = process.cwd(),
    concurrency = 6,
  } = options;

  if (!fs.existsSync(contentDir)) {
    console.log(`\n[WARN] Content directory not found: ${contentDir}`);
    return;
  }

  const sourceFiles = discoverContentFiles(contentDir, sourceLocale);
  if (sourceFiles.length === 0) {
    console.log('\n[INFO] No source content files found.');
    return;
  }

  const fieldsList = translatableFields || DEFAULT_TRANSLATABLE_FIELDS;

  // Load content hash manifest for change detection.
  // Maps "relPath:locale" → SHA-256 of source file at last sync time.
  // When the source changes, the hash won't match and the target is re-translated.
  const contentManifest = readContentManifest(cwd);
  const updatedManifest = { ...contentManifest };

  // Sort pair entries for deterministic output ordering
  const pairEntries = [...pairs.entries()].sort(([a], [b]) => a.localeCompare(b));

  console.log(`\n[INFO] Content sync: ${sourceFiles.length} source file(s) × ${pairEntries.length} language(s), concurrency: ${concurrency}`);
  if (dryRun) console.log('[INFO] Dry-run mode — no content files will be written.');

  let translated = 0;
  let retranslated = 0;
  let fallbackCount = 0;
  let skipped = 0;
  const contentFallbacks = [];

  const syncStartTime = Date.now();

  for (let fileIdx = 0; fileIdx < sourceFiles.length; fileIdx++) {
    const sourcePath = sourceFiles[fileIdx];
    const relPath = path.relative(contentDir, sourcePath);
    const fileNum = fileIdx + 1;
    const totalFiles = sourceFiles.length;

    // ETA calculation
    let etaStr = '';
    if (fileIdx > 0) {
      const elapsedMs = Date.now() - syncStartTime;
      const msPerFile = elapsedMs / fileIdx;
      const remainingMs = msPerFile * (totalFiles - fileIdx);
      const remainingMin = Math.ceil(remainingMs / 60000);
      etaStr = remainingMin > 1 ? `  (~${remainingMin} min remaining)` : '';
    }
    console.log(`  [${fileNum}/${totalFiles}] ${relPath}${etaStr}`);

    // Read source file once — shared across all locale translations
    const raw = fs.readFileSync(sourcePath, 'utf-8');
    const currentSourceHash = hashFileContent(sourcePath);

    // Parallelize across locales for this file
    const perPairResults = await pMap(pairEntries, async ([, pairConfig]) => {
      const code = pairConfig.target;
      const result = { translated: false, fallback: false, skipped: false, retranslated: false };

      const targetPath = getTargetContentPath(sourcePath, code, sourceLocale);

      // Security: verify target path stays within content directory
      if (!isPathContained(targetPath, contentDir)) {
        console.error(`    [ERR] ${code} — refusing to write outside content directory`);
        return result;
      }

      // Change detection for existing files
      const manifestKey = `${relPath}:${code}`;

      if (fs.existsSync(targetPath)) {
        const storedHash = contentManifest[manifestKey];
        if (storedHash && storedHash === currentSourceHash) {
          result.skipped = true;
          return result;
        }
        if (storedHash && storedHash !== currentSourceHash) {
          console.log(`    [CHANGED] ${code} — source updated, re-translating`);
          result.retranslated = true;
        } else if (!storedHash) {
          // No stored hash — check if this file was generated by a prior
          // rosetta run (contains [EN] fallback markers) or is a genuine
          // hand-translated file that should be preserved.
          //
          // BUG FIX: Previously, this always skipped hashless files.
          // This meant [EN] fallback files were permanently cached and
          // never retried — the user had to manually delete them.
          const existingContent = fs.readFileSync(targetPath, 'utf-8');
          const isRosettaFallback = existingContent.includes('[EN] ');
          if (!isRosettaFallback) {
            updatedManifest[manifestKey] = currentSourceHash;
            result.skipped = true;
            return result;
          }
          console.log(`    [RE-TRANSLATE] ${code} — replacing [EN] fallback`);
        }
      }

      if (dryRun) {
        const targetRel = path.relative(contentDir, targetPath);
        console.log(`    [INFO] Would create: ${targetRel}`);
        result.translated = true;
        return result;
      }

      // Parse source (shared raw content, parsing is stateless)
      const { frontMatter, rawFrontMatter, body, hasFrontMatter, frontMatterFormat } = parseContentFile(raw);

      // Translate front matter fields
      const translatedFields = {};
      let bodyUsedFallback = false;
      if (hasFrontMatter && apiKey) {
        const fieldsToTranslate = {};
        for (const field of fieldsList) {
          if (frontMatter[field] && typeof frontMatter[field] === 'string') {
            fieldsToTranslate[field] = frontMatter[field];
          }
        }

        if (Object.keys(fieldsToTranslate).length > 0) {
          process.stdout.write(`    [SYNC] ${code} front matter (${pairConfig.method})...`);
          const fmResult = await translateBatch(
            Object.keys(fieldsToTranslate),
            fieldsToTranslate,
            pairConfig,
            { apiKey, model: pairConfig.model, batchSize: pairConfig.batchSize || 30 },
          );
          if (fmResult) {
            Object.assign(translatedFields, fmResult);
            console.log(' [OK]');
          } else {
            for (const [field, value] of Object.entries(fieldsToTranslate)) {
              translatedFields[field] = `[EN] ${value}`;
            }
            console.log(' [WARN] fallback');
          }
        }
      } else if (hasFrontMatter) {
        console.log(`    [WARN] ${code}: no API key — front matter will use [EN] prefix`);
        for (const field of fieldsList) {
          if (frontMatter[field] && typeof frontMatter[field] === 'string') {
            translatedFields[field] = `[EN] ${frontMatter[field]}`;
          }
        }
      }

      // Translate body
      let translatedBody = body;
      if (body.trim()) {
        const { protectedBody, blocks } = protectBlocks(body);

        if (apiKey) {
          process.stdout.write(`    [SYNC] ${code} body (${pairConfig.method})...`);
          const prompt = buildContentPrompt(protectedBody, pairConfig, {
            sourceLanguageName: DEFAULT_REGISTERS[sourceLocale]?.name || sourceLocale,
            promptContext: pairConfig.promptContext || null,
          });
          const bodyResult = await translateRawContent(prompt, {
            apiKey,
            pairConfig,
          });

          if (bodyResult) {
            translatedBody = restoreBlocks(bodyResult, blocks);
            if (hasOrphanedPlaceholders(translatedBody)) {
              console.log(' [ERR] PLACEHOLDER CORRUPTION — falling back to English body');
              translatedBody = `<!-- [EN] Original English content (translation had corrupted code blocks) -->\n${body}`;
              bodyUsedFallback = true;
            } else {
              console.log(' [OK]');
            }
          } else {
            translatedBody = `<!-- [EN] Original English content -->\n${body}`;
            console.log(' [WARN] kept English');
            bodyUsedFallback = true;
          }
        } else {
          translatedBody = `<!-- [EN] Original English content -->\n${body}`;
          bodyUsedFallback = true;
        }
      }

      // Reassemble and write
      const output = reassembleContentFile({
        rawFrontMatter, translatedFields, translatedBody,
        hasFrontMatter, frontMatterFormat,
      });
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, output, 'utf-8');

      if (!apiKey) {
        result.fallback = true;
      } else if (bodyUsedFallback) {
        // Body fell back to [EN] — do NOT record hash so future runs retry
        result.fallback = true;
        contentFallbacks.push(`${relPath} → ${code}`);
      } else {
        result.translated = true;
        updatedManifest[manifestKey] = currentSourceHash;
      }

      return result;
    }, { concurrency });

    // Aggregate per-pair results into totals
    for (const r of perPairResults) {
      if (r.translated) translated++;
      if (r.fallback) fallbackCount++;
      if (r.skipped) skipped++;
      if (r.retranslated) retranslated++;
    }
  }

  // Write updated content manifest (skip in dry-run)
  if (!dryRun) {
    writeContentManifest(cwd, updatedManifest);
  }

  const totalCreated = translated + fallbackCount;
  if (totalCreated > 0 || skipped > 0 || retranslated > 0) {
    if (fallbackCount > 0 && translated === 0) {
      console.log(`\n${dryRun ? '[INFO] Would have created' : '[WARN] Created'} ${totalCreated} content file(s) — ALL used [EN] fallback (no API key). ${skipped} unchanged.`);
    } else if (fallbackCount > 0) {
      console.log(`\n${dryRun ? '[INFO] Would have created' : '[OK] Created'} ${translated} content file(s), ${fallbackCount} used [EN] fallback. ${skipped} unchanged.`);
    } else {
      const retranslateNote = retranslated > 0 ? ` (${retranslated} re-translated)` : '';
      console.log(`\n${dryRun ? '[INFO] Would have created' : '[OK] Created'} ${totalCreated} content file(s)${retranslateNote}, ${skipped} unchanged.`);
    }
  }
}

// -----------------------------------------------------------------
// Content hash manifest — SHA-256 change detection for content files
//
// Mirrors the key-value hash manifest (.i18n-rosetta.lock) but tracks
// source content files instead of key-value pairs. Stored separately
// to keep concerns clean and avoid conflicts.
// -----------------------------------------------------------------

const CONTENT_LOCK_FILENAME = '.i18n-rosetta-content.lock';

/**
 * Read the content hash manifest from disk.
 * Maps "sourceRelPath:targetLocale" → SHA-256 hash of source content.
 * Returns empty object on first run.
 *
 * @param {string} cwd - Project root directory
 * @returns {object} Hash manifest
 */
function readContentManifest(cwd) {
  const lockPath = path.join(cwd, CONTENT_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch (err) {
    console.error(`[WARN] Failed to parse content lock file: ${err.message}`);
    return {};
  }
}

/**
 * Write the content hash manifest to disk.
 * Sorts keys for deterministic, diff-friendly output.
 *
 * @param {string} cwd - Project root directory
 * @param {object} manifest - Hash manifest
 */
function writeContentManifest(cwd, manifest) {
  const lockPath = path.join(cwd, CONTENT_LOCK_FILENAME);
  const sorted = {};
  for (const key of Object.keys(manifest).sort()) {
    sorted[key] = manifest[key];
  }
  fs.writeFileSync(lockPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

/**
 * Compute SHA-256 hash of a file's content.
 *
 * @param {string} filePath - Absolute path to file
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashFileContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

export { runContentSync, CONTENT_LOCK_FILENAME };
