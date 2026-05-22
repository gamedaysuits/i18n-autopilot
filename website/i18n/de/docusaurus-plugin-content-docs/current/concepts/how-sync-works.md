---
sidebar_position: 2
title: "So funktioniert die Synchronisation"
---
# Wie Sync funktioniert

Der Befehl `sync` ist die Kernfunktion von rosetta. Hier ist, was passiert, wenn Sie `npx i18n-rosetta sync` ausführen.

## Pipeline-Übersicht

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing,\nstale, and fallback keys"]
    D --> E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 30/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    K --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Schritt für Schritt

### 1. Konfigurationsauflösung

Rosetta lädt `i18n-rosetta.config.json` (oder erkennt Einstellungen automatisch). Es ermittelt:
- Quell-Locale und Ziel-Locales
- Den Paar-Graphen (welche Quelle→Ziel-Kombinationen verarbeitet werden sollen)
- Methoden-, Modell- und Qualitätseinstellungen pro Paar

### 2. Quell-Scan

Die Quell-Locale-Datei wird geladen und in eine Schlüssel→Wert-Zuordnung (Map) abgeflacht:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Änderungserkennung

Rosetta liest `.i18n-rosetta.lock`, wo SHA-256-Hashes von zuvor übersetzten Quellwerten gespeichert sind. Für jeden Schlüssel wird Folgendes geprüft:

| Bedingung | Aktion |
|-----------|--------|
| Schlüssel fehlt im Ziel | **Übersetzen** |
| Quell-Hash hat sich seit dem letzten Sync geändert | **Neu übersetzen** (veraltet) |
| Zielwert beginnt mit `[EN]` | **Neu übersetzen** (Fallback-Platzhalter) |
| Quell-Hash unverändert, Schlüssel existiert | **Überspringen** |

Aus diesem Grund übersetzt rosetta nur das, was sich geändert hat – es wird nicht bei jedem Sync Ihre gesamte Datei neu übersetzt.

### 4. Batching

Schlüssel werden in Batches gruppiert (Standard: 30 Schlüssel/Batch für LLMs, 128 für Google Translate). Batching reduziert API-Roundtrips und hält die Prompts gleichzeitig überschaubar.

### 5. Übersetzung

Jeder Batch wird an die konfigurierte Übersetzungsmethode gesendet:

- **`llm`**: Strukturierter Prompt an OpenRouter mit Register-Anweisungen
- **`llm-coached`**: Dasselbe, aber mit injizierten Grammatikregeln, Wörterbuch und Stilhinweisen
- **`google-translate`**: Google Cloud Translation API v2 Batch-Anfrage
- **`api`**: HTTP POST an einen Remote-Endpunkt

Die Systemnachricht (Register, Regeln) ist über alle Batches für ein bestimmtes Locale hinweg identisch, was **Prompt Caching** ermöglicht – Anbieter wie Anthropic und Google cachen wiederholte Systemnachrichten, was die Token-Kosten senkt.

### 6. Quality Gate

Jede Übersetzung wird validiert, bevor sie auf die Festplatte geschrieben wird. Es werden fünf Prüfungen durchgeführt:

| Prüfung | Was sie erkennt | Beispiel |
|-------|----------------|---------|
| **Leer/Blank** | Modell hat nichts zurückgegeben | `""` |
| **Quell-Echo** | Modell hat die englische Eingabe zurückgegeben | `"Welcome"` für Japanisch |
| **Halluzinationsschleife** | Wiederholte Trigramme | `"Qo' Qo' Qo' Qo'"` |
| **Längeninflation** | Ausgabe ist 4×+ länger als die Quelle | 10-Zeichen-Quelle → 50-Zeichen-Ausgabe |
| **Schrift-Konformität** | Falsche Schriftart für das Locale | Lateinischer Text für arabisches Locale |

Fehlschläge werden mit einem `[GATE]`-Präfix protokolliert. Keine stillen Fallbacks.

Siehe [Quality Gate](/docs/concepts/quality-gate) für Details.

### 7. Retry-Kaskade

Bei JSON-Parsing-Fehlern oder Fehlern auf Batch-Ebene versucht rosetta es mit zunehmend kleineren Batches erneut:

```
Full batch (30 keys) → Failed
Half batch (15 keys) → Failed
Individual keys (1 each) → Isolates the problem key
```

Das Retry-Budget ist durch `maxRetries` begrenzt (Standard: 3), um ausufernde Token-Ausgaben zu verhindern.

### 8. Write & Lock

Erfolgreiche Übersetzungen werden in die Ziel-Locale-Datei geschrieben, wobei die ursprüngliche Verschachtelungsstruktur erhalten bleibt. Die Lock-Datei wird mit neuen SHA-256-Hashes aktualisiert.

## Partieller Erfolg

Ein fehlgeschlagener Batch blockiert nicht den Rest. Wenn 9 von 10 Batches erfolgreich sind, werden diese 9 geschrieben. Der fehlgeschlagene Batch wird protokolliert, und Sie können `sync` erneut ausführen, um es noch einmal zu versuchen.

## Dry Run

Zeigen Sie eine Vorschau der Änderungen an, ohne Dateien zu schreiben:

```bash
npx i18n-rosetta sync --dry
```

## Neuübersetzung erzwingen

Erzwingen Sie die Neuübersetzung bestimmter Schlüssel, auch wenn sie unverändert sind:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Kostenschätzung

Vor der Übersetzung generiert rosetta einen **Pre-Sync-Kostenbericht**, der die geschätzten Kosten pro Paar anzeigt. Dieser wird automatisch bei jedem `sync` ausgeführt – Sie sehen ihn, bevor API-Aufrufe getätigt werden.

```
╔══════════════════════════════════════════════════════════╗
║  Cost Estimate                                          ║
╠════════════╦═══════╦════════════╦════════════════════════╣
║ Pair       ║ Keys  ║ Est. Cost  ║ Method                 ║
╠════════════╬═══════╬════════════╬════════════════════════╣
║ en → fr    ║   142 ║ $0.07      ║ google-translate       ║
║ en → ja    ║    38 ║   —        ║ llm (model-dependent)  ║
║ en → crk   ║    38 ║   —        ║ llm-coached            ║
╚════════════╩═══════╩════════════╩════════════════════════╝
```

### Was geschätzt wird

Jede Übersetzungsmethode bietet ihre eigene Kostenschätzung:

| Methode | Kostenbasis | Präzision |
|--------|-----------|-----------|
| `google-translate` | Von Google veröffentlichter Tarif (20 $/Million Zeichen) | Genau |
| `llm` | Variiert je nach OpenRouter-Modell | Modellabhängig – siehe [OpenRouter-Preise](https://openrouter.ai/models) |
| `llm-coached` | Wie `llm` plus Coaching-Kontext-Token | Modellabhängig |
| `api` | Vom Server bestimmt | Unbekannt – kann ohne Abfrage des Endpunkts nicht geschätzt werden |

Wenn eine Methode die Kosten nicht ermitteln kann (LLM-Methoden, Remote-APIs), meldet rosetta `—`, anstatt zu raten. Verwenden Sie `--dry`, um Kostenschätzungen zu sehen, ohne tatsächlich zu übersetzen.