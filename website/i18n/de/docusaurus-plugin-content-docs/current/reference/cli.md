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
--dry                   Preview changes without writing files
```

---

## init

Interaktiver Einrichtungsassistent, der `i18n-rosetta.config.json` erstellt. Führt Sie durch die Ausgangssprache, Zielsprachen, das Dateiformat und das Übersetzungsmodell.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Option `--langs`**: Kommagetrennte Liste von Zielsprachencodes. Überspringt die Sprachabfrage und wendet Standard-Registervorgaben für jede Sprache an. Kombinieren Sie dies mit `--yes` für eine vollständig nicht-interaktive Einrichtung.

**Sprachvorgaben**: Wenn Sie nach Zielsprachen gefragt werden, können Sie die Namen der Vorgaben eingeben:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Mischen Sie Vorgaben und einzelne Codes: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Übersetzt fehlende, veraltete und Fallback-Schlüssel in allen Lokalisierungsdateien.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Änderungserkennung**: rosetta speichert SHA-256-Hashes in `.i18n-rosetta.lock`. Wenn sich Quellwerte ändern, übersetzt die nächste Synchronisierung diese Schlüssel automatisch neu. Fügen Sie die Sperrdatei der Versionskontrolle hinzu, damit alle Entwickler dieselbe Ausgangsbasis nutzen.

---

## watch

Automatische Synchronisierung, wenn sich die Quell-Lokalisierungsdatei ändert. Läuft, bis es mit `Ctrl+C` unterbrochen wird.

```bash
i18n-rosetta watch
```

---

## audit

Listet alle unübersetzten Fallback-Werte mit dem Präfix `[EN]` auf. Wird mit dem Code 1 beendet, falls welche gefunden werden — nutzen Sie dies als CI-Schranke, um Builds mit unvollständigen Übersetzungen fehlschlagen zu lassen.

```bash
i18n-rosetta audit
```

---

## lint

Durchsucht den Quellcode nach fest codierten, benutzerorientierten Zeichenfolgen, die i18n-Übersetzungsaufrufe verwenden sollten. Erkennt Ihr Framework automatisch (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Was erkannt wird:**
- Fest codierte Zeichenfolgen in JSX-Text, `placeholder`, `alt`, `aria-label`, `title`
- Dateien mit benutzerorientierten Inhalten, aber ohne Import eines i18n-Frameworks
- Tote Schlüssel — Lokalisierungsschlüssel, auf die keine Quelldatei verweist
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

**Sicherheitsmechanismen:**
1. Git-Clean-Prüfung (wird beim Testlauf übersprungen)
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
| `jsonld` | JSON-LD WebSite-Sprachschema |

---

## integrity

Erkennt Beschädigungen und Abweichungen in übersetzten Lokalisierungsdateien.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Was geprüft wird:**
- Platzhalter-Beschädigung (z. B. `{name}` in der Quelle vorhanden, fehlt aber im Ziel)
- Kodierungsprobleme (Zeichensalat, ungültiger Unicode)
- Unübersetzte Kopien (Zielwert ist identisch mit dem Quellwert)
- Verwaiste Schlüssel (Schlüssel im Ziel, die in der Quelle nicht existieren)

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

## Dreischichtige Pipeline

Verwenden Sie `lint`, `sync` und `audit` zusammen für eine absolut zuverlässige i18n:

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
| **Audit** | `audit` | Build-Schritt | Lässt das Deployment fehlschlagen, wenn eine Lokalisierung unvollständig ist |

---

## Siehe auch

- [Konfiguration](/docs/getting-started/configuration) — Referenz zur Konfigurationsdatei
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Methodenauswahl pro Sprachpaar
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — Format des Plugin-Manifests
- [CI/CD-Leitfaden](/docs/guides/ci-cd) — Automatisierung von CLI-Befehlen in Ihrer Pipeline
- [Wie Sync funktioniert](/docs/concepts/how-sync-works) — Verständnis der Synchronisierungspipeline
- [Qualitätsschranke (Quality Gate)](/docs/concepts/quality-gate) — wie Übersetzungen validiert werden