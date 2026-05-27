---
sidebar_position: 1
title: "CLI-Referenz"
---
# CLI-Referenz

## Befehle

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

Führen Sie `i18n-rosetta <command> --help` aus, um detaillierte Hilfe zu einem beliebigen Befehl zu erhalten.

## Globale Optionen

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

Ein interaktiver Einrichtungsassistent, der `i18n-rosetta.config.json` erstellt. Er führt Sie durch die Auswahl der Ausgangssprache, der Zielsprachen, des Dateiformats und des Übersetzungsmodells.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Option `--langs`**: Eine kommagetrennte Liste von Zielsprachencodes. Überspringt die Sprachabfrage und wendet Standard-Registervoreinstellungen für jede Sprache an. Kombinieren Sie dies mit `--yes` für eine vollständig nicht-interaktive Einrichtung.

**Sprachvoreinstellungen**: Wenn Sie nach Zielsprachen gefragt werden, können Sie die Namen von Voreinstellungen eingeben:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Mischen Sie Voreinstellungen und einzelne Codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Übersetzt fehlende, veraltete und Fallback-Schlüssel in allen Sprachdateien.

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

**Translation Memory**: Standardmäßig lädt `sync` die Datei `.rosetta/tm.json` und liefert zwischengespeicherte Übersetzungen für unveränderte Ausgangswerte. Verwenden Sie `--no-tm`, um den Zwischenspeicher zu umgehen (nützlich beim Wechsel von Übersetzungsanbietern oder bei der Fehlerbehebung der Qualität). Siehe [Translation Memory](/docs/concepts/translation-memory).

**Änderungserkennung**: rosetta speichert SHA-256-Hashes in `.i18n-rosetta.lock`. Wenn sich Ausgangswerte ändern, übersetzt der nächste Synchronisierungsvorgang diese Schlüssel automatisch neu. Übernehmen (committen) Sie die Lock-Datei in die Versionskontrolle, damit alle Entwickler dieselbe Ausgangsbasis teilen.

**Parallelität**: Die Übersetzung von Inhalten (Markdown, MDX, Blogbeiträge) läuft in einem flachen Aufgabenpool mit konfigurierbarer Nebenläufigkeit. Der Standardwert liegt bei 12 parallelen API-Aufrufen. Überschreiben Sie dies mit `--concurrency` oder dem Konfigurationsfeld `concurrency`. Die Übersetzung von JSON-Schlüsseln erfolgt sequenziell pro Sprache (dies ist schnell genug, sodass Parallelität keinen Vorteil bietet).

**Ausgabe**: Die Synchronisierung zeigt ein Versionsbanner, die Format-/Framework-Erkennung, eine Kostenschätzung und Fortschrittsbalken pro Sprache an:

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

Fortschrittsbalken werden nach jedem Stapel (ca. 30 Schlüssel) an Ort und Stelle aktualisiert. Verwenden Sie `--quiet`, um nur Fehler/Warnungen anzuzeigen, oder `--json` für eine maschinenlesbare NDJSON-Ausgabe. Beide Optionen unterdrücken den Fortschrittsbalken und das Banner.

---

## watch

Führt eine automatische Synchronisierung durch, wenn sich die Ausgangssprachdatei ändert. Läuft, bis der Vorgang mit `Ctrl+C` unterbrochen wird.

```bash
i18n-rosetta watch
```

---

## audit

Listet alle unübersetzten Fallback-Werte mit dem Präfix `[EN]` auf. Wird mit dem Exit-Code 1 beendet, falls welche gefunden werden — nutzen Sie dies als CI-Schranke, um Builds mit unvollständigen Übersetzungen fehlschlagen zu lassen.

```bash
i18n-rosetta audit
```

---

## lint

Durchsucht den Quellcode nach fest codierten, benutzerseitigen Zeichenfolgen, die i18n-Übersetzungsaufrufe verwenden sollten. Erkennt Ihr Framework automatisch (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Was erkannt wird:**
- Fest codierte Zeichenfolgen in JSX-Text, `placeholder`, `alt`, `aria-label`, `title`
- Dateien mit benutzerseitigen Inhalten, aber ohne Import eines i18n-Frameworks
- Tote Schlüssel — Sprachschlüssel, auf die keine Quellcode-Datei verweist
- Abdeckungsgrad — Prozentsatz der Zeichenfolgen, die über i18n verarbeitet werden

**Ausschlüsse**: Erstellen Sie `.rosettaignore` im Stammverzeichnis Ihres Projekts (Glob-Muster, wie `.gitignore`).

---

## wrap

Umschließt fest codierte Zeichenfolgen, die von `lint` erkannt wurden, automatisch mit `t()`-Aufrufen. Erstellt automatische Sicherungen, bevor Dateien geändert werden.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Sicherheitsvorkehrungen:**
1. Git-Clean-Prüfung (wird beim Probelauf übersprungen)
2. Automatische Sicherung nach `.rosetta-backup/`
3. Diff-Vorschau vor jedem Dateischreibvorgang
4. `--undo`-Unterstützung zur Wiederherstellung aus der Sicherung

---

## seo

Generiert SEO-Artefakte für mehrsprachige Websites.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Unterbefehl | Ausgabe |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>`-Tags |
| `sitemap` | Mehrsprachige `sitemap.xml` |
| `jsonld` | JSON-LD-WebSite-Sprachschema |

---

## integrity

Erkennt Beschädigungen und Abweichungen in übersetzten Sprachdateien.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Was geprüft wird:**
- Beschädigung von Platzhaltern (z. B. `{name}` ist in der Ausgangssprache vorhanden, fehlt aber in der Zielsprache)
- Kodierungsprobleme (Zeichensalat, ungültiger Unicode)
- Unübersetzte Kopien (Zielwert ist identisch mit dem Ausgangswert)
- Verwaiste Schlüssel (Schlüssel in der Zielsprache, die in der Ausgangssprache nicht existieren)
- Vollständigkeit der Plural-Kategorien im ICU-MessageFormat (z. B. benötigt Arabisch 6 Kategorien)

---

## tm

Verwaltet den Translation-Memory-Zwischenspeicher (`.rosetta/tm.json`). Das TM speichert frühere Übersetzungen und stellt diese bei nachfolgenden Synchronisierungen bereit, anstatt die API aufzurufen.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Unterbefehl | Ausgabe |
|------------|--------|
| `stats` | Anzahl der Einträge, Dateigröße, Aufschlüsselung nach Sprache |
| `clear` | Löscht die Cache-Datei (vollständig oder pro Sprache) |

| Option | Auswirkung |
|--------|--------|
| `--locale <code>` | Löscht nur die Einträge für eine bestimmte Sprache |
| `--yes` | Überspringt die Bestätigungsabfrage |

Siehe [Translation Memory](/docs/concepts/translation-memory) für Informationen darüber, wie das TM funktioniert und wann es geleert werden sollte.

---

## xliff

Exportiert und importiert XLIFF-1.2-Dateien für die Überprüfung durch professionelle Übersetzer. XLIFF ist das universelle Austauschformat, das von CAT-Tools wie memoQ, SDL Trados und Phrase unterstützt wird.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Unterbefehl | Ausgabe |
|------------|--------|
| `export` | Generiert `.xliff` aus den Ausgangs- und Zielsprachdateien |
| `import` | Führt überprüfte `.xliff`-Übersetzungen in die Sprachdateien zusammen |

| Option | Auswirkung |
|--------|--------|
| `--locale <code>` | Zielsprache für den Export (erforderlich) |
| `--out <path>` | Benutzerdefinierter Ausgabepfad oder -ordner |
| `--dry` | Vorschau des Imports ohne Schreibvorgang |

Siehe [Arbeiten mit professionellen Übersetzern](/docs/guides/professional-translators) für den vollständigen Arbeitsablauf.

---

## status

Zeigt die Konfiguration der Sprachpaare, installierte Plugins, Qualitätsstufen und Benchmark-Ergebnisse an.

```bash
i18n-rosetta status
```

---

## provenance

Überprüft die Lizenzierung der Übersetzungsressourcen für alle installierten Plugins.

```bash
i18n-rosetta provenance
```

---

## plugin

Verwaltet Plugins für Übersetzungsmethoden. Plugins sind vorgefertigte Übersetzungsrezepte, die in `.rosetta/methods/` installiert werden.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Siehe [Plugin-Spezifikation](/docs/reference/plugin-spec) für das Format des Plugin-Manifests.

---

## fonts

Lädt PUA-Webfonts für Skriptkonverter konstruierter Sprachen herunter und verwaltet diese. Sprachen, die Zeichen aus dem Private Use Area (PUA) verwenden (Klingonisch, Sindarin, Kryptonisch), benötigen benutzerdefinierte Webfonts, um ihre Schriften darzustellen. Dieser Befehl lädt sie aus verifizierten Open-Source-Repositories herunter.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Unterbefehl | Ausgabe |
|------------|--------|
| `list` | Zeigt an, welche PUA-Schriftarten benötigt werden und deren Installationsstatus |
| `install` | Lädt Schriftarten für konfigurierte Sprachen herunter |

| Option | Auswirkung |
|--------|--------|
| `--dir <path>` | Überschreibt das Ausgabeverzeichnis für Schriftarten (wird automatisch anhand des Projekttyps erkannt) |
| `--css` | Generiert ein `conlang-fonts.css`-Snippet zusammen mit den Schriftarten |
| `--config <path>` | Pfad zur Konfigurationsdatei (wird verwendet, um zu erkennen, welche Sprachen Schriftarten benötigen) |

**Automatische Erkennung:** Das Ausgabeverzeichnis wird aus Ihrer Projektstruktur abgeleitet:
- **Docusaurus** → `static/fonts/` oder `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Standard** → `public/fonts/`

**Native Unicode-Konverter** (`crk` → Cree-Silbenschrift, `sr` → Serbisches Kyrillisch) erfordern KEINE Installation von Schriftarten.

Siehe [Konstruierte Sprachen, Schriften & Orthografie](/docs/guides/conlangs-scripts-orthography) für vollständige Details zu PUA-Schriftarten.

## Drei-Schichten-Pipeline

Verwenden Sie `lint`, `sync` und `audit` zusammen für eine robuste i18n:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Schicht | Befehl | Wann | Zweck |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-Commit | Blockiert Commits mit fest codierten Zeichenfolgen |
| **Sync** | `sync` | Post-Commit / CI | Übersetzt fehlende und geänderte Schlüssel |
| **Audit** | `audit` | Build-Schritt | Lässt das Deployment fehlschlagen, wenn eine Sprache unvollständig ist |

---

## Siehe auch

- [Konfiguration](/docs/getting-started/configuration) — Referenz zur Konfigurationsdatei
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Methodenauswahl pro Sprachpaar
- [Translation Memory](/docs/concepts/translation-memory) — Zwischenspeicherung und Kosteneinsparungen
- [Arbeiten mit professionellen Übersetzern](/docs/guides/professional-translators) — XLIFF-Arbeitsablauf
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — Format des Plugin-Manifests
- [CI/CD-Leitfaden](/docs/guides/ci-cd) — Automatisierung von CLI-Befehlen in Ihrer Pipeline
- [Wie Sync funktioniert](/docs/concepts/how-sync-works) — Verständnis der Sync-Pipeline
- [Qualitätsschranke](/docs/concepts/quality-gate) — Wie Übersetzungen validiert werden