---
sidebar_position: 11
title: "Zusammenarbeit mit professionellen Übersetzer:innen"
---
# Zusammenarbeit mit professionellen Übersetzern

Rosetta generiert maschinelle Übersetzungen, aber einige Projekte erfordern eine menschliche Überprüfung — regulatorische Inhalte, markensensible Texte oder kritische Benutzeroberflächen. Der XLIFF-Arbeitsablauf ermöglicht es Ihnen, Übersetzungen für eine professionelle Überprüfung zu exportieren und sie nahtlos wieder zu importieren.

## Was ist XLIFF?

XLIFF (XML Localization Interchange File Format) ist das branchenübliche Austauschformat für Übersetzungswerkzeuge. Jedes professionelle CAT-Tool (Computer-Assisted Translation) unterstützt es:

- **memoQ** — XLIFF importieren, im Kontext überprüfen, überprüfte Datei exportieren
- **SDL Trados Studio** — native XLIFF-Unterstützung
- **Phrase (Memsource)** — XLIFF-Aufträge für Übersetzerteams hochladen
- **Smartling** — XLIFF-Import-Pipeline
- **OmegaT** — kostenloses/Open-Source-CAT-Tool mit XLIFF-Unterstützung

Rosetta generiert XLIFF 1.2 (die universell unterstützte Version) anstelle von 2.0+, um eine maximale Werkzeugkompatibilität zu gewährleisten.

## Der Arbeitsablauf

```mermaid
flowchart LR
    A["rosetta sync\n(machine translation)"] --> B["xliff export\n--locale fr"]
    B --> C["Send .xliff to\ntranslator"]
    C --> D["Translator reviews\nin CAT tool"]
    D --> E["xliff import\nreviewed.xliff"]
    E --> F["rosetta sync\n(fills gaps)"]
```

### Schritt 1: Maschinelle Übersetzungen generieren

Führen Sie zunächst `sync` aus, um eine maschinelle Basisübersetzung zu erhalten:

```bash
i18n-rosetta sync
```

### Schritt 2: XLIFF exportieren

Exportieren Sie das Paar aus Ausgangs- und Zielsprache als XLIFF:

```bash
i18n-rosetta xliff export --locale fr
```

Dies schreibt `.rosetta/xliff/fr.xliff` mit folgendem Inhalt:
- Jeder Quellschlüssel mit seinem englischen Wert
- Die aktuelle maschinelle Übersetzung (falls vorhanden) als `<target>`
- Schlüssel ohne Übersetzungen, markiert als `state="new"`

```xml
<trans-unit id="hero.title" xml:space="preserve">
  <source>Welcome to our platform</source>
  <target state="translated">Bienvenue sur notre plateforme</target>
</trans-unit>
```

### Schritt 3: An den Übersetzer senden

Senden Sie die Datei `.xliff` an Ihren Übersetzer oder laden Sie sie auf Ihre CAT-Plattform hoch. Der Übersetzer sieht Ausgangs- und Zieltext nebeneinander und kann:

- Maschinelle Übersetzungen bearbeiten
- Fehlende Übersetzungen ergänzen
- Qualitätsprobleme markieren
- Sein eigenes Translation Memory und seine eigenen Terminologiedatenbanken anwenden

### Schritt 4: Überprüfte Datei importieren

Wenn der Übersetzer die überprüfte `.xliff` zurücksendet, importieren Sie diese:

```bash
# Preview what will change
i18n-rosetta xliff import .rosetta/xliff/fr.xliff --dry

# Apply changes
i18n-rosetta xliff import .rosetta/xliff/fr.xliff
```

Ausgabe:
```
  ✓ Imported 142 translations for fr
    Updated:    23 (changed from existing)
    Added:      0 (new keys)
    Unchanged:  119
    Written to: locales/fr.json
```

### Schritt 5: Lücken füllen

Wenn nach dem XLIFF-Export neue Schlüssel hinzugefügt wurden, führen Sie `sync` aus, um diese zu übersetzen:

```bash
i18n-rosetta sync
```

Rosetta übersetzt nur Schlüssel, die noch fehlen — überprüfte Übersetzungen aus dem XLIFF-Import bleiben erhalten.

## Tipps

### Benutzerdefinierte Pfade exportieren

```bash
# Export to a specific directory
i18n-rosetta xliff export --locale ja --out ./for-review/

# Export with a specific filename
i18n-rosetta xliff export --locale de --out ./review/german.xliff
```

### Mehrere Gebietsschemas

Exportieren Sie jedes Gebietsschema separat:

```bash
for locale in fr de ja ko; do
  i18n-rosetta xliff export --locale $locale
done
```

### Versionskontrolle

Fügen Sie `.rosetta/xliff/` zu `.gitignore` hinzu — XLIFF-Dateien sind temporäre Artefakte, kein Projektquellcode:

```gitignore
.rosetta/xliff/
```

### Wann Sie XLIFF anstelle von nur `sync` verwenden sollten

| Szenario | Empfehlung |
|----------|---------------|
| Interne App, 90%+ Qualität akzeptabel | Nur `sync` — maschinelle Übersetzung ist ausreichend |
| Benutzerorientierte Marketingtexte | XLIFF für menschliche Überprüfung exportieren |
| Rechtliche/regulatorische Inhalte | XLIFF exportieren — menschliche Überprüfung erforderlich |
| 50+ Gebietsschemas, knappe Frist | Zuerst `sync`, XLIFF-Export nur für die Top-5-Gebietsschemas |
| Übersetzer verwendet bereits ein CAT-Tool | XLIFF ist das natürliche Übergabeformat |

---

## Siehe auch

- [CLI-Referenz — xliff](/docs/reference/cli#xliff) — Befehlsreferenz
- [Translation Memory](/docs/concepts/translation-memory) — Zwischenspeicherung überprüfter Übersetzungen
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Optionen für maschinelle Übersetzungen