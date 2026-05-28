---
sidebar_position: 1
title: "CLI Reference"
---
# CLI Reference

## Mga Command

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta verify            Verify translations are present and correct (CI gate)
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

I-run ang `i18n-rosetta <command> --help` para sa detalyadong tulong sa anumang command.

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
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 12)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 50)
--content-concurrency <n> Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--no-verify             Skip post-sync verification pass
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
```

---

## init

Interactive setup wizard na gumagawa ng `i18n-rosetta.config.json`. Gagamayan ka nito sa pag-set up ng source locale, target languages, file format, at translation model.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` option**: Comma-separated list ng mga target language code. Ii-skip nito ang language prompt at ia-apply ang default register presets para sa bawat language. I-combine sa `--yes` para sa fully non-interactive na setup.

**Language presets**: Kapag na-prompt para sa target languages, pwede mo i-type ang preset names:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Pwedeng i-mix ang presets at individual codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Tinatranslate ang mga missing at stale na keys sa lahat ng locale files. Nagra-run po ito ng post-sync verification by default.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls (both phases)
i18n-rosetta sync --json-concurrency 30              # 30 parallel locale translations (JSON)
i18n-rosetta sync --content-concurrency 8            # 8 parallel content translations
i18n-rosetta sync --no-verify                        # skip post-sync verification
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Translation Memory**: By default, nilo-load ng `sync` ang `.rosetta/tm.json` at sineserve ang cached translations para sa mga unchanged na source values. Gamitin ang `--no-tm` para i-bypass ang cache (useful ito kapag nagpapalit ng translation providers o nagde-debug ng quality). Tingnan ang [Translation Memory](/docs/concepts/translation-memory).

**Change detection**: Nag-iistore ang rosetta ng SHA-256 hashes sa `.i18n-rosetta.lock`. Kapag nagbago ang source values, awtomatikong ire-retranslate ng susunod na sync ang mga keys na iyon. I-commit ang lock file para ma-share ng lahat ng developers ang baseline.

**Parallelism**: Parehong nagra-run in parallel ang JSON key translation at content translation. Sabay-sabay tina-translate ang JSON locales (default: 50 concurrent locales), at naka-parallelize din ang mga batches sa loob ng bawat locale (4 concurrent batches). Ang content translation (Markdown, MDX, blog posts) ay nagra-run sa isang flat work-item pool (default: 12 concurrent API calls). I-override gamit ang `--json-concurrency`, `--content-concurrency`, o `--concurrency` (sine-set pareho).

**Output**: Nagdi-display ang sync ng version banner, format/framework detection, cost estimate, at per-locale na progress bars:

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

Nag-uupdate in-place ang progress bars pagkatapos ng bawat batch (~80 keys). Gamitin ang `--quiet` para sa errors/warnings lang, o `--json` para sa machine-readable na NDJSON output. Pareho nitong isinu-suppress ang progress bar at banner.

---

## watch

Nag-o-auto-sync kapag nagbago ang source locale file. Magra-run ito hanggang ma-interrupt gamit ang `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Inililista ang lahat ng untranslated na `[EN]`-prefixed fallback values mula sa mga nakaraang run. Mag-e-exit ito with code 1 kung may nahanap — gamitin bilang CI gate para i-fail ang mga build na may incomplete translations.

```bash
i18n-rosetta audit
```

---

## verify

Babasahin ulit ang lahat ng locale files mula sa disk at ive-verify kung present at tama ang mga translation. Ito rin po ang same verification na awtomatikong nagra-run sa dulo ng bawat `sync` (maliban na lang kung ipinasa ang `--no-verify`).

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**Mga tsine-check nito:**
- Key parity — present ang lahat ng source keys sa bawat target
- `[EN]` fallback markers mula sa mga nakaraang run
- Empty translations
- Script compliance — dapat may non-ASCII translations ang mga non-Latin locales
- Placeholder preservation — nagma-match sa source ang ICU placeholders
- Encoding issues — BOM markers, invisible characters
- Source echoes — values na identical sa source (warning)

---

## lint

Ini-scan ang source code para sa mga hardcoded na user-facing strings na dapat gumagamit ng i18n translation calls. Ina-auto-detect nito ang iyong framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Mga nade-detect nito:**
- Hardcoded strings sa JSX text, `placeholder`, `alt`, `aria-label`, `title`
- Files na may user-facing content pero walang i18n framework import
- Dead keys — locale keys na hindi naka-reference sa anumang source file
- Coverage score — percentage ng mga strings na dumadaan sa i18n

**Exclusions**: Gumawa ng `.rosettaignore` sa iyong project root (glob patterns, tulad ng `.gitignore`).

---

## wrap

Ina-auto-wrap ang mga hardcoded strings na na-detect ng `lint` sa loob ng `t()` calls. Gumagawa ito ng automatic backups bago i-modify ang mga files.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Safety gates:**
1. Git-clean check (ini-skip sa dry-run)
2. Automatic backup sa `.rosetta-backup/`
3. Diff preview bago ang bawat file write
4. `--undo` support para mag-restore mula sa backup

---

## seo

Mag-generate ng SEO artifacts para sa mga multilingual sites.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Subcommand | Output |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>` tags |
| `sitemap` | Multilingual na `sitemap.xml` |
| `jsonld` | JSON-LD WebSite language schema |

---

## integrity

Nade-detect ang corruption at drift sa mga translated na locale files.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Mga tsine-check nito:**
- Placeholder corruption (halimbawa, present ang `{name}` sa source pero missing sa target)
- Encoding issues (mojibake, invalid Unicode)
- Untranslated copies (identical ang target value sa source)
- Orphaned keys (mga keys sa target na wala sa source)
- ICU MessageFormat plural category completeness (halimbawa, kailangan ng Arabic ng 6 na categories)

---

## tm

I-manage ang Translation Memory cache (`.rosetta/tm.json`). Nag-iistore ang TM ng mga previous translations at sineserve ang mga ito sa mga susunod na sync imbes na tawagin ang API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Subcommand | Output |
|------------|--------|
| `stats` | Entry count, file size, per-locale breakdown |
| `clear` | I-delete ang cache file (full o per-locale) |

| Option | Effect |
|--------|--------|
| `--locale <code>` | I-clear lang ang mga entries para sa isang locale |
| `--yes` | I-skip ang confirmation prompt |

Tingnan ang [Translation Memory](/docs/concepts/translation-memory) para malaman kung paano gumagana ang TM at kailan ito dapat i-clear.

---

## xliff

Mag-export at mag-import ng XLIFF 1.2 files para sa professional translator review. Ang XLIFF ay ang universal exchange format na sinusuportahan ng mga CAT tools tulad ng memoQ, SDL Trados, at Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Subcommand | Output |
|------------|--------|
| `export` | Mag-generate ng `.xliff` mula sa source + target locale files |
| `import` | I-merge ang mga na-review na `.xliff` translations sa mga locale files |

| Option | Effect |
|--------|--------|
| `--locale <code>` | Target locale para sa export (required) |
| `--out <path>` | Custom output path o directory |
| `--dry` | I-preview ang import nang hindi nagsusulat sa file |

Tingnan ang [Working with Professional Translators](/docs/guides/professional-translators) para sa buong workflow.

---

## status

Ipakita ang pair configuration, installed plugins, quality tiers, at benchmark scores.

```bash
i18n-rosetta status
```

---

## provenance

I-audit ang translation resource licensing para sa lahat ng installed plugins.

```bash
i18n-rosetta provenance
```

---

## plugin

I-manage ang translation method plugins. Ang mga plugin ay pre-packaged translation recipes na naka-install sa `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Tingnan ang [Plugin Specification](/docs/reference/plugin-spec) para sa plugin manifest format.

---

## fonts

Nagda-download at nagma-manage ng PUA web fonts para sa constructed language script converters. Ang mga language na gumagamit ng Private Use Area characters (Klingon, Sindarin, Kryptonian) ay nangangailangan ng custom web fonts para ma-render ang kanilang mga script. Dina-download ng command na ito ang mga font mula sa mga verified open-source repositories.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Subcommand | Output |
|------------|--------|
| `list` | Ipinapakita kung aling PUA fonts ang kailangan at ang kanilang install status |
| `install` | Nagda-download ng fonts para sa mga configured na languages |

| Option | Effect |
|--------|--------|
| `--dir <path>` | I-override ang font output directory (auto-detected mula sa project type) |
| `--css` | Mag-generate ng `conlang-fonts.css` snippet kasama ng mga font |
| `--config <path>` | Path papunta sa config file (ginagamit para ma-detect kung aling languages ang kailangan ng fonts) |

**Auto-detection:** Ang output directory ay ini-infer mula sa iyong project structure:
- **Docusaurus** → `static/fonts/` o `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Default** → `public/fonts/`

**Native Unicode converters** (`crk` → Cree Syllabics, `sr` → Serbian Cyrillic) ay HINDI nangangailangan ng font installation.

Tingnan ang [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) para sa buong detalye ng PUA font.

## Three-Layer Pipeline

Gamitin ang `lint`, `sync`, at `audit` nang magkakasama para sa bulletproof na i18n:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Layer | Command | Kailan | Purpose |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | I-block ang mga commit na may hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | I-translate ang mga missing at changed na keys |
| **Verify** | `verify` | Post-sync / CI | I-confirm kung present at tama ang mga translation |
| **Audit** | `audit` | Build step | I-fail ang deployment kung may `[EN]` markers ang anumang locale |

---

## Tingnan Din

- [Configuration](/docs/getting-started/configuration) — config file reference
- [Translation Methods](/docs/guides/translation-methods) — method selection per pair
- [Translation Memory](/docs/concepts/translation-memory) — caching at cost savings
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF workflow
- [Plugin Specification](/docs/reference/plugin-spec) — plugin manifest format
- [CI/CD Guide](/docs/guides/ci-cd) — pag-automate ng CLI commands sa iyong pipeline
- [How Sync Works](/docs/concepts/how-sync-works) — pag-intindi sa sync pipeline
- [Quality Gate](/docs/concepts/quality-gate) — kung paano vina-validate ang mga translation