---
sidebar_position: 1
title: "CLI-referentie"
---
# CLI-referentie

## Commando's

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

Voer `i18n-rosetta <command> --help` uit voor gedetailleerde hulp bij een commando.

## Globale opties

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

Interactieve installatiewizard die `i18n-rosetta.config.json` aanmaakt. Begeleidt u door de bron-locale, doeltalen, het bestandsformaat en het vertaalmodel.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs`-optie**: Kommagescheiden lijst van doeltaalcodes. Slaat de taalprompt over en past de standaard register-presets toe voor elke taal. Combineer met `--yes` voor een volledig niet-interactieve installatie.

**Taal-presets**: Wanneer u wordt gevraagd naar doeltalen, kunt u de namen van presets typen:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Combineer presets en individuele codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Vertaalt ontbrekende, verouderde en fallback-sleutels in alle locale-bestanden.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Wijzigingsdetectie**: rosetta slaat SHA-256-hashes op in `.i18n-rosetta.lock`. Wanneer bronwaarden veranderen, vertaalt de volgende sync deze sleutels automatisch opnieuw. Commit het lock-bestand zodat alle ontwikkelaars dezelfde basislijn delen.

---

## watch

Automatische synchronisatie (auto-sync) wanneer het bron-locale-bestand verandert. Blijft draaien totdat het wordt onderbroken met `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Toont een lijst van alle onvertaalde fallback-waarden met het voorvoegsel `[EN]`. Sluit af met code 1 als er waarden worden gevonden — gebruik dit als een CI-gate om builds met onvolledige vertalingen te laten falen.

```bash
i18n-rosetta audit
```

---

## lint

Scant de broncode op hardcoded gebruikersgerichte strings die i18n-vertaalaanroepen zouden moeten gebruiken. Detecteert automatisch uw framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Wat het detecteert:**
- Hardcoded strings in JSX-tekst, `placeholder`, `alt`, `aria-label`, `title`
- Bestanden met gebruikersgerichte content maar zonder import van een i18n-framework
- Dode sleutels (dead keys) — locale-sleutels waarnaar geen enkel bronbestand verwijst
- Dekkingsscore (coverage score) — percentage van strings dat via i18n verloopt

**Uitzonderingen**: Maak `.rosettaignore` aan in de root van uw project (glob-patronen, zoals `.gitignore`).

---

## wrap

Pakt hardcoded strings die zijn gedetecteerd door `lint` automatisch in met `t()`-aanroepen. Maakt automatische back-ups voordat bestanden worden gewijzigd.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Veiligheidscontroles:**
1. Git-clean-controle (overgeslagen in dry-run)
2. Automatische back-up naar `.rosetta-backup/`
3. Diff-voorbeeld voordat elk bestand wordt weggeschreven
4. `--undo`-ondersteuning om te herstellen vanuit een back-up

---

## seo

Genereer SEO-artefacten voor meertalige sites.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Subcommando | Uitvoer |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>`-tags |
| `sitemap` | Meertalige `sitemap.xml` |
| `jsonld` | JSON-LD WebSite-taalschema |

---

## integrity

Detecteert corruptie en afwijkingen (drift) in vertaalde locale-bestanden.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Wat het controleert:**
- Corruptie van placeholders (bijv. `{name}` aanwezig in de bron maar ontbrekend in het doel)
- Coderingsproblemen (mojibake, ongeldige Unicode)
- Onvertaalde kopieën (doelwaarde identiek aan bronwaarde)
- Verweesde sleutels (sleutels in het doel die niet in de bron bestaan)

---

## status

Toont de configuratie van talenparen, geïnstalleerde plug-ins, kwaliteitsniveaus en benchmarkscores.

```bash
i18n-rosetta status
```

---

## provenance

Controleert de licenties van vertaalbronnen voor alle geïnstalleerde plug-ins.

```bash
i18n-rosetta provenance
```

---

## plugin

Beheer plug-ins voor vertaalmethoden. Plug-ins zijn vooraf verpakte vertaalrecepten die worden geïnstalleerd in `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Zie [Plug-inspecificatie](/docs/reference/plugin-spec) voor het formaat van het plug-in-manifest.

---

## Drielaagse pipeline

Gebruik `lint`, `sync` en `audit` samen voor een waterdichte i18n:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Laag | Commando | Wanneer | Doel |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Blokkeer commits met hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | Vertaal ontbrekende en gewijzigde sleutels |
| **Audit** | `audit` | Build-stap | Laat de deployment falen als een locale onvolledig is |

---

## Zie ook

- [Configuratie](/docs/getting-started/configuration) — referentie voor configuratiebestand
- [Vertaalmethoden](/docs/guides/translation-methods) — methodeselectie per talenpaar
- [Plug-inspecificatie](/docs/reference/plugin-spec) — formaat van het plug-in-manifest
- [CI/CD-gids](/docs/guides/ci-cd) — CLI-commando's automatiseren in uw pipeline
- [Hoe Sync werkt](/docs/concepts/how-sync-works) — de sync-pipeline begrijpen
- [Quality Gate](/docs/concepts/quality-gate) — hoe vertalingen worden gevalideerd