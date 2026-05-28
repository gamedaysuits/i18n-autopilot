#!/usr/bin/env node
/**
 * i18n-rosetta CLI — Dispatcher
 *
 * Thin entry point that parses arguments and routes to command modules
 * in lib/commands/. Each command is a separate module exporting:
 *   async function run(args, cwd) → exit code (0 or 1)
 *
 * This file handles ONLY:
 *   1. Argument parsing (via Node.js built-in util.parseArgs)
 *   2. Command routing
 *   3. Per-command --help routing
 *   4. Process exit codes
 *   5. Top-level error handling
 */

import { parseArgs } from 'node:util';

// -----------------------------------------------------------------
// Parse CLI arguments via util.parseArgs (Node 18.3+)
//
// strict: false allows unknown flags to pass through without errors,
// since each command defines its own flags and the dispatcher doesn't
// need to enumerate all possible flags.
// -----------------------------------------------------------------
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  strict: false,
  allowPositionals: true,
  options: {
    // --- Boolean flags (shared across commands) ---
    dry:              { type: 'boolean' },
    'dry-run':        { type: 'boolean' },    // alias for --dry (more intuitive)
    help:             { type: 'boolean', short: 'h' },
    version:          { type: 'boolean', short: 'v' },
    yes:              { type: 'boolean', short: 'y' },
    'warn-only':      { type: 'boolean' },
    'no-verify':      { type: 'boolean' },  // skip post-sync verification
    undo:             { type: 'boolean' },
    'force-content':  { type: 'boolean' },  // re-translate all content files (clears content lock)
    'no-tm':          { type: 'boolean' },  // skip Translation Memory for this sync run
    css:              { type: 'boolean' },  // fonts install --css: generate CSS snippet
    json:             { type: 'boolean' },  // machine-readable NDJSON output
    quiet:            { type: 'boolean', short: 'q' },  // suppress info/ok messages, show only warnings/errors

    // --- String flags (take a value) ---
    config:        { type: 'string' },
    dir:           { type: 'string' },
    'content-dir': { type: 'string' },
    source:        { type: 'string' },
    langs:         { type: 'string' },
    model:         { type: 'string' },
    method:        { type: 'string' },
    format:        { type: 'string' },
    'base-url':    { type: 'string' },
    out:           { type: 'string' },
    src:           { type: 'string' },
    'min-length':  { type: 'string' },
    'force-keys':  { type: 'string' },
    concurrency:           { type: 'string' },     // sets both json + content concurrency (backward compat)
    'json-concurrency':    { type: 'string' },     // max parallel API calls for JSON key-value translation (default: 50)
    'content-concurrency': { type: 'string' },     // max parallel API calls for markdown content (default: 12)
    temperature:   { type: 'string' },     // sampling temperature for LLM methods
    locale:        { type: 'string' },     // target locale for xliff export, tm clear
  },
});

// Build the args object in the shape all command modules expect:
//   { _: ['command', 'subcommand', ...], flagName: value, ... }
// This preserves backward compatibility with every command module.
const args = { _: positionals, ...values };

// --dry-run is an alias for --dry — merge so command modules only check args.dry
if (args['dry-run']) args.dry = true;

const command = args._[0] || 'help';
const cwd = process.cwd();

// -----------------------------------------------------------------
// --version: print version from package.json and exit
// -----------------------------------------------------------------
if (args.version) {
  // URL is a global — no need to import node:url.
  // Dynamic import of node:fs is consistent with the lazy-loading
  // strategy used for command modules below.
  import('node:fs').then(fs => {
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    console.log(`i18n-rosetta v${pkg.version}`);
    process.exit(0);
  });
} else

// -----------------------------------------------------------------
// Per-command --help: intercept before loading command modules
// If the user runs `rosetta <cmd> --help`, show focused help for
// that command without loading its module (fast, no side effects).
// -----------------------------------------------------------------
if (args.help && command !== 'help') {
  import('../lib/command-help.js').then(({ showCommandHelp }) => {
    const found = showCommandHelp(command);
    if (!found) {
      console.error(`[ERR] Unknown command: ${command}`);
      console.error('       Run "i18n-rosetta help" to see all commands.');
      process.exit(1);
    }
    process.exit(0);
  });
} else {
  // -----------------------------------------------------------------
  // Command routing — dynamic import() keeps startup fast (ESM-native)
  // -----------------------------------------------------------------
  const commands = {
    init:       () => import('../lib/commands/init.js'),
    sync:       () => import('../lib/commands/sync.js'),
    watch:      () => import('../lib/commands/watch.js'),
    audit:      () => import('../lib/commands/audit.js'),
    lint:       () => import('../lib/commands/lint.js'),
    status:     () => import('../lib/commands/status.js'),
    provenance: () => import('../lib/commands/provenance.js'),
    wrap:       () => import('../lib/commands/wrap.js'),
    seo:        () => import('../lib/commands/seo.js'),
    integrity:  () => import('../lib/commands/integrity.js'),
    plugin:     () => import('../lib/commands/plugin.js'),
    fonts:      () => import('../lib/commands/fonts.js'),
    tm:         () => import('../lib/commands/tm.js'),
    xliff:      () => import('../lib/commands/xliff.js'),
    models:     () => import('../lib/commands/models.js'),
    verify:     () => import('../lib/commands/verify.js'),
  };

  if (commands[command]) {
    commands[command]()
      .then(mod => mod.run(args, cwd))
      .then(code => process.exit(code || 0))
      .catch(err => {
        console.error(`[ERR] ${command} failed:`, err.message);
        process.exit(1);
      });
  } else if (command === 'help') {
    import('../lib/commands/help.js').then(mod => mod.run());
  } else {
    // Unknown command — error loudly so CI typos don't silently pass
    console.error(`[ERR] Unknown command: "${command}"`);
    console.error('      Run "i18n-rosetta help" to see all commands.');
    process.exit(1);
  }
}
