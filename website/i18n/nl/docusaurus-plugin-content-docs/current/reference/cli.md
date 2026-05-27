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
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

Voer `i18n-rosetta <command> --help` uit voor gedetailleerde hulp bij elk commando.

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

Interactieve installatiewizard die `i18n-rosetta.config.json` aanmaakt. Begeleidt u door de bron-locale, doeltalen, het bestandsformaat en het vertaalmodel.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs`-optie**: Kommagescheiden lijst van doeltaalcodes. Slaat de taalprompt over en past standaard register-presets toe voor elke taal. Combineer met `--yes` voor een volledig niet-interactieve installatie.

**Taal-presets**: Wanneer u wordt gevraagd naar doeltalen, kunt u preset-namen typen:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Combineer presets en individuele codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Vertaalt ontbrekende, verouderde en fallback-keys in alle locale-bestanden.

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

**Translation Memory**: Standaard laadt `sync` `.rosetta/tm.json` en levert het gecachte vertalingen voor ongewijzigde bronwaarden. Gebruik `--no-tm` om de cache te omzeilen (handig bij het wisselen van vertaalproviders of het debuggen van kwaliteit). Zie [Translation Memory](/docs/concepts/translation-memory).

**Wijzigingsdetectie**: rosetta slaat SHA-256-hashes op in `.i18n-rosetta.lock`. Wanneer bronwaarden veranderen, vertaalt de volgende sync deze keys automatisch opnieuw. Commit het lock-bestand zodat alle ontwikkelaars dezelfde basislijn delen.

**Parallellisme**: Contentvertaling (Markdown, MDX, blogposts) draait in een platte work-item pool met configureerbare gelijktijdigheid (concurrency). De standaardwaarde is 12 parallelle API-aanroepen. Overschrijf dit met `--concurrency` of het configuratieveld `concurrency`. JSON-key-vertaling wordt sequentieel per locale uitgevoerd (dit is snel genoeg, waardoor parallellisme geen voordeel biedt).

**Uitvoer**: Sync toont een versiebanner, formaat-/frameworkdetectie, kostenraming en voortgangsbalken per locale:

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

Voortgangsbalken worden na elke batch (~30 keys) op hun plaats bijgewerkt. Gebruik `--quiet` voor uitsluitend fouten/waarschuwingen, of `--json` voor machineleesbare NDJSON-uitvoer. Beide onderdrukken de voortgangsbalk en banner.

---

## watch

Automatische sync wanneer het bron-locale-bestand wijzigt. Blijft draaien totdat het wordt onderbroken met `Ctrl+C`.

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
- Bestanden met gebruikersgerichte content maar zonder i18n-framework-import
- Dode keys — locale-keys waarnaar geen enkel bronbestand verwijst
- Dekkingsscore (coverage score) — percentage van strings dat via i18n verloopt

**Uitzonderingen**: Maak `.rosettaignore` aan in de root van uw project (glob-patronen, zoals `.gitignore`).

---

## wrap

Pakt hardcoded strings die door `lint` zijn gedetecteerd automatisch in `t()`-aanroepen in. Maakt automatische back-ups voordat bestanden worden gewijzigd.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Veiligheidscontroles:**
1. Git-clean controle (overgeslagen in dry-run)
2. Automatische back-up naar `.rosetta-backup/`
3. Diff-voorbeeld voor elke bestandsschrijfactie
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
- Placeholder-corruptie (bijv. `{name}` aanwezig in de bron maar ontbrekend in het doel)
- Coderingsproblemen (mojibake, ongeldige Unicode)
- Onvertaalde kopieën (doelwaarde identiek aan de bron)
- Verweesde keys (keys in het doel die niet in de bron bestaan)
- Volledigheid van ICU MessageFormat-meervoudscategorieën (bijv. Arabisch heeft 6 categorieën nodig)

---

## tm

Beheer de Translation Memory-cache (`.rosetta/tm.json`). TM slaat eerdere vertalingen op en levert deze bij volgende syncs in plaats van de API aan te roepen.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Subcommando | Uitvoer |
|------------|--------|
| `stats` | Aantal items, bestandsgrootte, uitsplitsing per locale |
| `clear` | Verwijder cachebestand (volledig of per locale) |

| Optie | Effect |
|--------|--------|
| `--locale <code>` | Wis alleen items voor één locale |
| `--yes` | Sla de bevestigingsprompt over |

Zie [Translation Memory](/docs/concepts/translation-memory) voor hoe TM werkt en wanneer u deze moet wissen.

---

## xliff

Exporteer en importeer XLIFF 1.2-bestanden voor beoordeling door professionele vertalers. XLIFF is het universele uitwisselingsformaat dat wordt ondersteund door CAT-tools zoals memoQ, SDL Trados en Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Subcommando | Uitvoer |
|------------|--------|
| `export` | Genereer `.xliff` uit bron- en doel-locale-bestanden |
| `import` | Voeg beoordeelde `.xliff`-vertalingen samen in locale-bestanden |

| Optie | Effect |
|--------|--------|
| `--locale <code>` | Doel-locale voor export (vereist) |
| `--out <path>` | Aangepast uitvoerpad of -map |
| `--dry` | Voorbeeld van import zonder te schrijven |

Zie [Werken met professionele vertalers](/docs/guides/professional-translators) voor de volledige workflow.

---

## status

Toon paarconfiguratie, geïnstalleerde plug-ins, kwaliteitsniveaus en benchmarkscores.

```bash
i18n-rosetta status
```

---

## provenance

Controleer de licenties van vertaalbronnen voor alle geïnstalleerde plug-ins.

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

Zie [Plug-in-specificatie](/docs/reference/plugin-spec) voor het formaat van het plug-in-manifest.

---

## fonts

Downloadt en beheert PUA-webfonts voor scriptconverters van geconstrueerde talen. Talen die Private Use Area-tekens gebruiken (Klingon, Sindarijns, Kryptoniaans) hebben aangepaste webfonts nodig om hun scripts weer te geven. Dit commando downloadt deze vanuit geverifieerde open-source repositories.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Subcommando | Uitvoer |
|------------|--------|
| `list` | Toont welke PUA-fonts nodig zijn en hun installatiestatus |
| `install` | Downloadt fonts voor geconfigureerde talen |

| Optie | Effect |
|--------|--------|
| `--dir <path>` | Overschrijf de uitvoermap voor fonts (automatisch gedetecteerd op basis van projecttype) |
| `--css` | Genereer een `conlang-fonts.css`-fragment naast de fonts |
| `--config <path>` | Pad naar configuratiebestand (gebruikt om te detecteren welke talen fonts nodig hebben) |

**Automatische detectie:** De uitvoermap wordt afgeleid uit uw projectstructuur:
- **Docusaurus** → `static/fonts/` of `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Standaard** → `public/fonts/`

**Native Unicode-converters** (`crk` → Cree-syllabenschrift, `sr` → Servisch Cyrillisch) vereisen GEEN font-installatie.

Zie [Kunsttalen, scripts & orthografie](/docs/guides/conlangs-scripts-orthography) voor volledige details over PUA-fonts.

## Drielaagse pipeline

Gebruik `lint`, `sync` en `audit` samen voor waterdichte i18n:

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
| **Sync** | `sync` | Post-commit / CI | Vertaal ontbrekende en gewijzigde keys |
| **Audit** | `audit` | Build-stap | Laat de deployment falen als een locale onvolledig is |

---

## Zie ook

- [Configuratie](/docs/getting-started/configuration) — referentie voor configuratiebestand
- [Vertaalmethoden](/docs/guides/translation-methods) — methodeselectie per paar
- [Translation Memory](/docs/concepts/translation-memory) — caching en kostenbesparingen
- [Werken met professionele vertalers](/docs/guides/professional-translators) — XLIFF-workflow
- [Plug-in-specificatie](/docs/reference/plugin-spec) — formaat van plug-in-manifest
- [CI/CD-gids](/docs/guides/ci-cd) — CLI-commando's automatiseren in uw pipeline
- [Hoe Sync werkt](/docs/concepts/how-sync-works) — de sync-pipeline begrijpen
- [Quality Gate](/docs/concepts/quality-gate) — hoe vertalingen worden gevalideerd