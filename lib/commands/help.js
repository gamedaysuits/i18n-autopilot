/**
 * Command: help
 *
 * Prints the full CLI help screen with all commands, options,
 * supported formats, and quick-start instructions.
 */

import { CONFIG_FILENAMES } from '../config.js';

const DEFAULT_CONFIG_FILENAME = CONFIG_FILENAMES[0];

/**
 * @returns {void}
 */
function run() {
  console.log(`
  i18n-rosetta v3 — Research-grade translation engine for i18n projects

  COMMANDS
    init         Interactive setup wizard (or --yes for quick defaults)
    sync         Translate & sync all locale files
    watch        Auto-sync when the source file changes
    audit        List all untranslated [EN] fallback values
    lint         Scan source files for hardcoded strings (pre-commit gate)
    wrap         Auto-wrap hardcoded strings in t() calls (with undo)
    seo          Generate hreflang, sitemap.xml, or JSON-LD schema
    integrity    Audit locale files for placeholder/encoding issues
    status       Show pair graph, methods, and config summary
    provenance   Show licensing & resource dependencies for all pairs
    plugin       Manage method plugins (install, remove, list)
    fonts        Download web fonts for PUA script converters
    tm           Manage Translation Memory cache (stats, clear)
    xliff        Export/import XLIFF 1.2 for professional review
    models       List available models for a provider

  OPTIONS
    --config <path>    Path to config file (default: ${DEFAULT_CONFIG_FILENAME})
    --dir <path>       Override locales directory
    --content-dir <p>  Hugo content directory for Markdown translation
    --source <code>    Override source locale (default: en)
    --base-url <url>   Override base URL for SEO commands
    --model <model>    Override translation model
    --method <method>  Default translation method: llm, llm-coached, google-translate, api, deepl, microsoft-translator, libretranslate, openai, anthropic, gemini
    --format <fmt>     Locale file format: json, toml, yaml, or auto (default: auto)
    --dry              Preview changes without writing files
    --force-keys <k>   Comma-separated dot-notation keys to force re-translate
    --src <path>       Source directory for lint/wrap (auto-detected)
    --min-length <n>   Minimum string length to flag (default: 2)
    --warn-only        Exit 0 even with issues (lint, integrity)
    --undo             Restore files from .rosetta-backup/ (wrap)
    --out <path>       Write output to file (seo sitemap, xliff export)
    --locale <code>    Target locale (xliff export, tm clear)
    --no-tm            Skip Translation Memory cache for this sync run

  SUPPORTED FORMATS
    json     Standard JSON (next-intl, i18next, react-intl)
    toml     Hugo i18n TOML files (i18n/*.toml)
    yaml     Hugo i18n YAML files (i18n/*.yaml)
    auto     Auto-detect from file extensions in locales directory

  QUICK START
    1. Set OPENROUTER_API_KEY (or provider key like OPENAI_API_KEY, DEEPL_API_KEY, etc.) in your environment or .env.local
    2. Put your source locale (en.json / en.toml / en.yaml) in a locales/ directory
    3. Run: i18n-rosetta sync

  The tool will:
    • Auto-detect locale file format (JSON, TOML, or YAML)
    • Translate missing keys via OpenRouter (gpt-4o-mini)
    • Translate Hugo Markdown content files (if --content-dir is set)
    • Write [EN]-prefixed placeholders when --fallback is set (re-sync with an API key for real translations)
    • Batch translations to avoid token overflow
    • Preserve your file structure and formatting
    • Cache translations in Translation Memory to avoid redundant API calls

  Run i18n-rosetta <command> --help for detailed help on any command.
  `);
}

export { run };
