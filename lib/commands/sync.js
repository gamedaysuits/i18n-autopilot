/**
 * Command: sync
 *
 * Translates & syncs all locale files based on the project config.
 * Delegates entirely to lib/sync.runSync — this module just bridges
 * CLI arguments to the sync engine's options object.
 */

import { runSync } from '../sync.js';

/**
 * @param {import('../types.js').CLIArgs} args - Parsed CLI arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<number>} Exit code (0 = success, 1 = error)
 */
async function run(args, cwd) {
  await runSync({
    dryRun: !!args.dry,
    cwd,
    cliArgs: args,
  });
  return 0;
}

export { run };
