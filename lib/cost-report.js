/**
 * cost-report.js — Pre-sync cost estimation display
 *
 * Extracted from sync.js to reduce god-module complexity.
 * This module is purely informational — it reads locale files,
 * estimates translation costs via the pairs API, and prints a
 * formatted table using the output controller. No side effects
 * on sync state.
 *
 * Called once at the start of runSync when an OPENROUTER_API_KEY
 * is available. Failures are non-blocking — they log a warning
 * and allow the sync to continue.
 */

import fs from 'node:fs';
import path from 'node:path';
import { flattenKeys } from './flatten.js';
import { diffLocale } from './diff.js';
import { readLocaleFile } from './format.js';
import { output } from './output.js';

/**
 * Estimate and display translation costs for all pairs that have keys to translate.
 *
 * @param {Array<[string, object]>} pairEntries - Sorted pair graph entries [pairKey, pairConfig]
 * @param {object} sourceFlat - Flattened source locale key-value map
 * @param {object} config - Resolved project config (needs localesDir, fallbackPrefix, forceKeys)
 * @param {string} format - Detected format ('json', 'toml', 'yaml')
 * @param {string} ext - File extension for the format (e.g. '.json')
 * @param {string[]} changedKeys - Keys whose source content changed since last sync
 * @returns {Promise<void>}
 */
export async function printCostEstimate(pairEntries, sourceFlat, config, format, ext, changedKeys) {
  const apiKeyForCost = process.env.OPENROUTER_API_KEY;
  if (!apiKeyForCost) return;

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
      output.info('Estimated translation cost:');
      output.raw('');

      // Column headers
      const maxPair = Math.max(4, ...costEstimates.map(e => e.pair.length));
      const maxMethod = Math.max(6, ...costEstimates.map(e => e.method.length));

      output.raw(`  ${'Pair'.padEnd(maxPair)}  ${'Method'.padEnd(maxMethod)}  ${'Keys'.padStart(6)}  ${'Est. Cost'.padStart(10)}`);
      output.raw(`  ${'─'.repeat(maxPair)}  ${'─'.repeat(maxMethod)}  ${'─'.repeat(6)}  ${'─'.repeat(10)}`);

      for (const e of costEstimates) {
        output.raw(`  ${e.pair.padEnd(maxPair)}  ${e.method.padEnd(maxMethod)}  ${String(e.keys).padStart(6)}  ${e.cost.padStart(10)}`);
      }

      const totalStr = hasUnknownCosts
        ? `~$${totalEstimatedCost.toFixed(4)}+ (some methods have unknown pricing)`
        : `~$${totalEstimatedCost.toFixed(4)}`;
      output.raw(`\n  Total: ${totalStr}`);
      output.raw('  Note: Estimates are approximate. Actual cost depends on string length and model pricing.');
      output.raw('');
    }
  } catch (costError) {
    // Cost estimation is non-blocking — log and continue
    output.warn(`Cost estimation failed: ${costError.message}`);
  }
}
