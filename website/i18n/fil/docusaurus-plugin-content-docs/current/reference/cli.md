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
```

I-run po ang `i18n-rosetta <command> --help` para sa detailed help sa kahit anong command.

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
--dry                   Preview changes without writing files
```

---

## init

Interactive setup wizard na gumagawa ng `i18n-rosetta.config.json`. Iga-guide po kayo nito sa pag-set up ng source locale, target languages, file format, at translation model.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` option**: Comma-separated list ng mga target language code. Ini-skip nito ang language prompt at ina-apply ang default register presets para sa bawat language. I-combine ito sa `--yes` para sa fully non-interactive na setup.

**Language presets**: Kapag na-prompt para sa target languages, pwede po kayong mag-type ng preset names:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Pwedeng i-mix ang presets at individual codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Tina-translate nito ang mga missing, stale, at fallback keys sa lahat ng locale files.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Change detection**: Nag-i-store ang rosetta ng SHA-256 hashes sa `.i18n-rosetta.lock`. Kapag nagbago ang source values, automatic na ire-re-translate ng susunod na sync ang mga keys na iyon. I-commit po ang lock file para ma-share ng lahat ng developers ang baseline.

---

## watch

Nag-o-auto-sync kapag nagbago ang source locale file. Mag-ra-run po ito hanggang sa ma-interrupt gamit ang `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Nili-list nito ang lahat ng untranslated na `[EN]`-prefixed fallback values. Mag-e-exit ito with code 1 kapag may na-detect — gamitin po ito bilang CI gate para i-fail ang mga builds na may incomplete translations.

```bash
i18n-rosetta audit
```

---

## lint

Ini-scan nito ang source code para sa mga hardcoded user-facing strings na dapat gumagamit ng i18n translation calls. Nag-o-auto-detect po ito ng inyong framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Mga nade-detect nito:**
- Hardcoded strings sa JSX text, `placeholder`, `alt`, `aria-label`, `title`
- Mga files na may user-facing content pero walang i18n framework import
- Dead keys — mga locale keys na hindi nire-reference ng kahit anong source file
- Coverage score — percentage ng mga strings na dumadaan sa i18n

**Exclusions**: Gumawa po ng `.rosettaignore` sa inyong project root (glob patterns, tulad ng `.gitignore`).

---

## wrap

Nag-o-auto-wrap ng mga hardcoded strings na na-detect ng `lint` sa loob ng `t()` calls. Gumagawa po ito ng automatic backups bago i-modify ang mga files.

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
| `sitemap` | Multilingual `sitemap.xml` |
| `jsonld` | JSON-LD WebSite language schema |

---

## integrity

Nade-detect nito ang corruption at drift sa mga translated locale files.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Mga tsine-check nito:**
- Placeholder corruption (halimbawa, `{name}` na present sa source pero missing sa target)
- Encoding issues (mojibake, invalid Unicode)
- Untranslated copies (target value na identical sa source)
- Orphaned keys (mga keys sa target na wala sa source)

---

## status

Ipinapakita ang pair configuration, installed plugins, quality tiers, at benchmark scores.

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

I-manage ang translation method plugins. Ang mga plugins ay pre-packaged translation recipes na naka-install sa `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Tingnan po ang [Plugin Specification](/docs/reference/plugin-spec) para sa plugin manifest format.

---

## Three-Layer Pipeline

Gamitin po ang `lint`, `sync`, at `audit` nang magkakasama para sa bulletproof na i18n:

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
| **Lint** | `lint` | Pre-commit | I-block ang commits na may hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | I-translate ang missing at changed keys |
| **Audit** | `audit` | Build step | I-fail ang deployment kapag may incomplete na locale |

---

## See Also

- [Configuration](/docs/getting-started/configuration) — config file reference
- [Translation Methods](/docs/guides/translation-methods) — method selection per pair
- [Plugin Specification](/docs/reference/plugin-spec) — plugin manifest format
- [CI/CD Guide](/docs/guides/ci-cd) — pag-automate ng CLI commands sa inyong pipeline
- [How Sync Works](/docs/concepts/how-sync-works) — pag-intindi sa sync pipeline
- [Quality Gate](/docs/concepts/quality-gate) — paano bina-validate ang mga translations