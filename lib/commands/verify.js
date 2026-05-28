/**
 * Command: verify
 *
 * Re-reads all locale files from disk and confirms translations are
 * actually present and correct. Catches the gap between sync reporting
 * success and keys being wrong in fact.
 *
 * Exit code 1 if errors found (CI-gate compatible).
 * --warn-only exits 0 regardless.
 *
 * This runs the same checks that sync's post-sync verification uses,
 * but can be invoked independently for CI pipelines or manual auditing.
 */

import { resolveConfig } from '../config.js';
import { verifyLocales } from '../verify.js';

/**
 * @param {import('../types.js').CLIArgs} args - Parsed CLI arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<number>} Exit code (0 = success, 1 = errors found)
 */
async function run(args, cwd) {
  const config = resolveConfig(args, cwd);
  const { errors } = await verifyLocales(config, cwd);

  if (errors > 0 && !args['warn-only']) {
    return 1;
  }
  return 0;
}

export { run };
