---
sidebar_position: 1
title: CLI Reference
---

# CLI Reference

## Commands

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

Run `i18n-rosetta <command> --help` for detailed help on any command.

## Global Options

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
```

---

## init

Interactive setup wizard that creates `i18n-rosetta.config.json`. Guides through source locale, target languages, file format, and translation model.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` option**: Comma-separated list of target language codes. Skips the language prompt and applies default register presets for each language. Combine with `--yes` for fully non-interactive setup.

**Language presets**: When prompted for target languages, you can type preset names:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Mix presets and individual codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Translates missing, stale, and fallback keys across all locale files.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Translation Memory**: By default, `sync` loads `.rosetta/tm.json` and serves cached translations for unchanged source values. Use `--no-tm` to bypass the cache (useful when switching translation providers or debugging quality). See [Translation Memory](/docs/concepts/translation-memory).

**Change detection**: rosetta stores SHA-256 hashes in `.i18n-rosetta.lock`. When source values change, the next sync automatically re-translates those keys. Commit the lock file so all developers share the baseline.

**Parallelism**: Content translation (Markdown, MDX, blog posts) runs in a flat work-item pool with configurable concurrency. Default is 12 parallel API calls. Override with `--concurrency` or the `concurrency` config field. JSON key translation runs sequentially per locale (fast enough that parallelism adds no benefit).

**Output**: Sync displays a version banner, format/framework detection, cost estimate, and per-locale progress bars:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

Progress bars update in-place after each batch (~30 keys). Use `--quiet` for errors/warnings only, or `--json` for machine-readable NDJSON output. Both suppress the progress bar and banner.

---

## watch

Auto-sync when the source locale file changes. Runs until interrupted with `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

List all untranslated `[EN]`-prefixed fallback values. Exits with code 1 if any are found — use as a CI gate to fail builds with incomplete translations.

```bash
i18n-rosetta audit
```

---

## lint

Scans source code for hardcoded user-facing strings that should use i18n translation calls. Auto-detects your framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**What it detects:**
- Hardcoded strings in JSX text, `placeholder`, `alt`, `aria-label`, `title`
- Files with user-facing content but no i18n framework import
- Dead keys — locale keys that no source file references
- Coverage score — percentage of strings going through i18n

**Exclusions**: Create `.rosettaignore` in your project root (glob patterns, like `.gitignore`).

---

## wrap

Auto-wraps hardcoded strings detected by `lint` in `t()` calls. Creates automatic backups before modifying files.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Safety gates:**
1. Git-clean check (skipped in dry-run)
2. Automatic backup to `.rosetta-backup/`
3. Diff preview before each file write
4. `--undo` support to restore from backup

---

## seo

Generate SEO artifacts for multilingual sites.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Subcommand | Output |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>` tags |
| `sitemap` | Multilingual `sitemap.xml` |
| `jsonld` | JSON-LD WebSite language schema |

---

## integrity

Detects corruption and drift in translated locale files.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**What it checks:**
- Placeholder corruption (e.g., `{name}` present in source but missing in target)
- Encoding issues (mojibake, invalid Unicode)
- Untranslated copies (target value identical to source)
- Orphaned keys (keys in target that don't exist in source)
- ICU MessageFormat plural category completeness (e.g., Arabic needs 6 categories)

---

## tm

Manage the Translation Memory cache (`.rosetta/tm.json`). TM stores previous translations and serves them on subsequent syncs instead of calling the API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Subcommand | Output |
|------------|--------|
| `stats` | Entry count, file size, per-locale breakdown |
| `clear` | Delete cache file (full or per-locale) |

| Option | Effect |
|--------|--------|
| `--locale <code>` | Clear only entries for one locale |
| `--yes` | Skip confirmation prompt |

See [Translation Memory](/docs/concepts/translation-memory) for how TM works and when to clear it.

---

## xliff

Export and import XLIFF 1.2 files for professional translator review. XLIFF is the universal exchange format supported by CAT tools like memoQ, SDL Trados, and Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Subcommand | Output |
|------------|--------|
| `export` | Generate `.xliff` from source + target locale files |
| `import` | Merge reviewed `.xliff` translations into locale files |

| Option | Effect |
|--------|--------|
| `--locale <code>` | Target locale for export (required) |
| `--out <path>` | Custom output path or directory |
| `--dry` | Preview import without writing |

See [Working with Professional Translators](/docs/guides/professional-translators) for the full workflow.

---

## status

Show pair configuration, installed plugins, quality tiers, and benchmark scores.

```bash
i18n-rosetta status
```

---

## provenance

Audit translation resource licensing for all installed plugins.

```bash
i18n-rosetta provenance
```

---

## plugin

Manage translation method plugins. Plugins are pre-packaged translation recipes installed to `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

See [Plugin Specification](/docs/reference/plugin-spec) for the plugin manifest format.

---

## fonts

Downloads and manages PUA web fonts for constructed language script converters. Languages that use Private Use Area characters (Klingon, Sindarin, Kryptonian) need custom web fonts to render their scripts. This command downloads them from verified open-source repositories.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Subcommand | Output |
|------------|--------|
| `list` | Shows which PUA fonts are needed and their install status |
| `install` | Downloads fonts for configured languages |

| Option | Effect |
|--------|--------|
| `--dir <path>` | Override font output directory (auto-detected from project type) |
| `--css` | Generate a `conlang-fonts.css` snippet alongside the fonts |
| `--config <path>` | Path to config file (used to detect which languages need fonts) |

**Auto-detection:** The output directory is inferred from your project structure:
- **Docusaurus** → `static/fonts/` or `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Default** → `public/fonts/`

**Native Unicode converters** (`crk` → Cree Syllabics, `sr` → Serbian Cyrillic) do NOT require font installation.

See [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) for full PUA font details.

## Three-Layer Pipeline

Use `lint`, `sync`, and `audit` together for bulletproof i18n:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Layer | Command | When | Purpose |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Block commits with hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | Translate missing and changed keys |
| **Audit** | `audit` | Build step | Fail deployment if any locale is incomplete |

---

## See Also

- [Configuration](/docs/getting-started/configuration) — config file reference
- [Translation Methods](/docs/guides/translation-methods) — method selection per pair
- [Translation Memory](/docs/concepts/translation-memory) — caching and cost savings
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF workflow
- [Plugin Specification](/docs/reference/plugin-spec) — plugin manifest format
- [CI/CD Guide](/docs/guides/ci-cd) — automating CLI commands in your pipeline
- [How Sync Works](/docs/concepts/how-sync-works) — understanding the sync pipeline
- [Quality Gate](/docs/concepts/quality-gate) — how translations are validated
