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
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

I-run ang `i18n-rosetta <command> --help` para sa detailed help sa kahit anong command.

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
```

---

## init

Interactive setup wizard na gumagawa ng `i18n-rosetta.config.json`. Iga-guide ka nito sa pag-set up ng source locale, target languages, file format, at translation model.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` option**: Comma-separated list ng mga target language code. I-i-skip nito ang language prompt at ia-apply ang default register presets para sa bawat language. I-combine sa `--yes` para sa fully non-interactive na setup.

**Language presets**: Kapag na-prompt para sa target languages, pwede mo i-type ang mga preset name:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Pwedeng i-mix ang mga preset at individual codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Tinatranslate nito ang mga missing, stale, at fallback keys sa lahat ng locale files.

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

**Translation Memory**: By default, nilo-load ng `sync` ang `.rosetta/tm.json` at sineserve ang mga cached translation para sa mga unchanged source values. Gamitin ang `--no-tm` para i-bypass ang cache (useful ito kapag nagpapalit ng translation providers o nagde-debug ng quality). Tingnan ang [Translation Memory](/docs/concepts/translation-memory).

**Change detection**: Nag-i-store ang rosetta ng mga SHA-256 hash sa `.i18n-rosetta.lock`. Kapag nagbago ang mga source value, automatic na ire-retranslate ng susunod na sync ang mga keys na 'yon. I-commit ang lock file para ma-share ng lahat ng developers ang baseline.

**Parallelism**: Ang content translation (Markdown, MDX, blog posts) ay nagra-run sa isang flat work-item pool na may configurable concurrency. Ang default ay 12 parallel API calls. I-override gamit ang `--concurrency` o ang `concurrency` config field. Ang JSON key translation ay nagra-run sequentially per locale (mabilis na ito kaya walang benefit ang parallelism).

---

## watch

Auto-sync kapag may nagbago sa source locale file. Magra-run ito hanggang sa ma-interrupt gamit ang `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

I-list ang lahat ng untranslated na `[EN]`-prefixed fallback values. Mag-e-exit ito with code 1 kapag may nahanap — gamitin ito bilang CI gate para i-fail ang mga build na may incomplete translations.

```bash
i18n-rosetta audit
```

---

## lint

Ini-iscan ang source code para sa mga hardcoded user-facing strings na dapat gumagamit ng i18n translation calls. Auto-detect nito ang framework mo (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Mga nade-detect nito:**
- Mga hardcoded string sa JSX text, `placeholder`, `alt`, `aria-label`, `title`
- Mga file na may user-facing content pero walang i18n framework import
- Dead keys — mga locale key na hindi nire-reference ng kahit anong source file
- Coverage score — percentage ng mga string na dumadaan sa i18n

**Exclusions**: Gumawa ng `.rosettaignore` sa project root niyo (mga glob pattern, tulad ng `.gitignore`).

---

## wrap

Ina-auto-wrap ang mga hardcoded string na na-detect ng `lint` sa mga `t()` call. Gumagawa ito ng automatic backups bago i-modify ang mga file.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Safety gates:**
1. Git-clean check (ini-iskip sa dry-run)
2. Automatic backup sa `.rosetta-backup/`
3. Diff preview bago mag-write sa bawat file
4. `--undo` support para mag-restore mula sa backup

---

## seo

Mag-generate ng mga SEO artifact para sa mga multilingual site.

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

Nade-detect ang corruption at drift sa mga translated locale file.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Mga tsine-check nito:**
- Placeholder corruption (halimbawa, ang `{name}` ay nasa source pero nawawala sa target)
- Encoding issues (mojibake, invalid Unicode)
- Untranslated copies (parehong-pareho ang target value sa source)
- Orphaned keys (mga key sa target na wala sa source)
- ICU MessageFormat plural category completeness (halimbawa, kailangan ng Arabic ng 6 na categories)

---

## tm

I-manage ang Translation Memory cache (`.rosetta/tm.json`). Nag-i-store ang TM ng mga previous translation at sineserve ang mga ito sa mga susunod na sync imbes na mag-call sa API.

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
| `--locale <code>` | I-clear lang ang mga entry para sa isang locale |
| `--yes` | I-skip ang confirmation prompt |

Tingnan ang [Translation Memory](/docs/concepts/translation-memory) para sa kung paano gumagana ang TM at kung kailan ito dapat i-clear.

---

## xliff

Mag-export at mag-import ng mga XLIFF 1.2 file para sa professional translator review. Ang XLIFF ay ang universal exchange format na sinusuportahan ng mga CAT tool tulad ng memoQ, SDL Trados, at Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Subcommand | Output |
|------------|--------|
| `export` | Mag-generate ng `.xliff` mula sa source + target locale files |
| `import` | I-merge ang mga na-review na `.xliff` translation sa mga locale file |

| Option | Effect |
|--------|--------|
| `--locale <code>` | Target locale para sa export (required) |
| `--out <path>` | Custom output path o directory |
| `--dry` | I-preview ang import nang hindi nagra-write |

Tingnan ang [Working with Professional Translators](/docs/guides/professional-translators) para sa buong workflow.

---

## status

Ipakita ang pair configuration, mga naka-install na plugin, quality tiers, at benchmark scores.

```bash
i18n-rosetta status
```

---

## provenance

I-audit ang translation resource licensing para sa lahat ng naka-install na plugin.

```bash
i18n-rosetta provenance
```

---

## plugin

I-manage ang mga translation method plugin. Ang mga plugin ay mga pre-packaged translation recipe na naka-install sa `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Tingnan ang [Plugin Specification](/docs/reference/plugin-spec) para sa plugin manifest format.

---

## fonts

Nagda-download at nagma-manage ng mga PUA web font para sa mga constructed language script converter. Ang mga language na gumagamit ng Private Use Area characters (Klingon, Sindarin, Kryptonian) ay kailangan ng mga custom web font para ma-render ang scripts nila. Dina-download ng command na ito ang mga 'yon mula sa mga verified open-source repository.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Subcommand | Output |
|------------|--------|
| `list` | Ipinapakita kung anong mga PUA font ang kailangan at ang install status ng mga ito |
| `install` | Nagda-download ng mga font para sa mga configured language |

| Option | Effect |
|--------|--------|
| `--dir <path>` | I-override ang font output directory (auto-detected mula sa project type) |
| `--css` | Mag-generate ng `conlang-fonts.css` snippet kasama ng mga font |
| `--config <path>` | Path sa config file (ginagamit para ma-detect kung anong mga language ang kailangan ng fonts) |

**Auto-detection:** Ang output directory ay ini-infer mula sa project structure niyo:
- **Docusaurus** → `static/fonts/` o `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Default** → `public/fonts/`

Ang **Native Unicode converters** (`crk` → Cree Syllabics, `sr` → Serbian Cyrillic) ay HINDI nangangailangan ng font installation.

Tingnan ang [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) para sa buong detalye ng PUA font.

## Three-Layer Pipeline

Gamitin ang `lint`, `sync`, at `audit` nang sabay-sabay para sa bulletproof na i18n:

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
| **Sync** | `sync` | Post-commit / CI | I-translate ang mga missing at nagbagong key |
| **Audit** | `audit` | Build step | I-fail ang deployment kapag may incomplete na locale |

---

## See Also

- [Configuration](/docs/getting-started/configuration) — config file reference
- [Translation Methods](/docs/guides/translation-methods) — method selection per pair
- [Translation Memory](/docs/concepts/translation-memory) — caching at cost savings
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF workflow
- [Plugin Specification](/docs/reference/plugin-spec) — plugin manifest format
- [CI/CD Guide](/docs/guides/ci-cd) — pag-automate ng mga CLI command sa pipeline niyo
- [How Sync Works](/docs/concepts/how-sync-works) — pag-intindi sa sync pipeline
- [Quality Gate](/docs/concepts/quality-gate) — kung paano vina-validate ang mga translation