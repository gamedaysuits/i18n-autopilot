---
sidebar_position: 2
title: "Wie die Synchronisation funktioniert"
---
# Wie die Synchronisierung funktioniert

Der Befehl `sync` ist die Kernfunktion von rosetta. Hier erfahren Sie, was passiert, wenn Sie `npx i18n-rosetta sync` ausführen.

## Übersicht der Pipeline

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing\nand stale keys"]
    D --> TM{"TM lookup"}
    TM -->|Hits| TC["Serve from cache"]
    TM -->|Misses| E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 80/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> TERM["Terminology check\n(coached pairs)"]
    TERM --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    TC --> I
    K --> TMS["Store new entries\nin TM"]
    TMS --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Schritt für Schritt

### 1. Auflösung der Konfiguration

Rosetta lädt `i18n-rosetta.config.json` (oder erkennt die Einstellungen automatisch). Dabei wird Folgendes aufgelöst:
- Quell- und Zielsprachen
- Der Paargraph (welche Quelle→Ziel-Kombinationen verarbeitet werden sollen)
- Methoden-, Modell- und Qualitätseinstellungen pro Paar

Bevor die Dateien gescannt werden, gibt rosetta einen Start-Header aus:

```
i18n-rosetta v3.3.2

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **Versionsbanner**: Zeigt die installierte Version für die Fehlerbehebung und Problemberichte an.
- **Formaterkennung**: Meldet das Dateiformat und ob es automatisch erkannt (`(auto)`) oder explizit konfiguriert (`(config)`) wurde. Unterstützt `json`, `toml` und `yaml`.
- **Framework-Erkennung**: Wenn `contentDir` festgelegt ist, wird das Framework (`Hugo`) identifiziert, um zu bestätigen, dass die Inhaltssynchronisierung aktiv ist.

### 2. Scannen der Quelle

Die Datei der Quellsprache wird geladen und in eine Schlüssel→Wert-Zuordnung abgeflacht:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Änderungserkennung

Rosetta liest `.i18n-rosetta.lock`, wo die SHA-256-Hashes der zuvor übersetzten Quellwerte gespeichert sind. Für jeden Schlüssel wird Folgendes geprüft:

| Bedingung | Aktion |
|-----------|--------|
| Schlüssel fehlt im Ziel | **Übersetzen** |
| Quell-Hash hat sich seit der letzten Synchronisierung geändert | **Neu übersetzen** (veraltet) |
| Zielwert beginnt mit `[EN]` | **Neu übersetzen** (veraltete Fallback-Markierung) |
| Quell-Hash unverändert, Schlüssel existiert | **Überspringen** |

Aus diesem Grund übersetzt rosetta nur das, was sich geändert hat – es wird nicht bei jeder Synchronisierung Ihre gesamte Datei neu übersetzt.

### 4. Stapelverarbeitung (Batching)

Schlüssel werden in Stapeln gruppiert (Standard: 80 Schlüssel/Stapel für LLMs, 128 für Google Translate). Die Stapelverarbeitung reduziert API-Aufrufe und hält die Prompts gleichzeitig überschaubar.

Während der Übersetzung zeigt rosetta einen Inline-Fortschrittsbalken an, der nach Abschluss jedes Stapels aktualisiert wird:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

Der Balken wird mithilfe des Wagenrücklaufs `\r` für direkte Aktualisierungen gerendert – kein Scrollen. Wird in den Modi `--quiet` und `--json` unterdrückt.

### 4b. Translation Memory

Vor der Stapelverarbeitung prüft rosetta den Translation-Memory-Cache (`.rosetta/tm.json`). Schlüssel, deren Quelltext + Sprache + Methode mit einer vorherigen Übersetzung übereinstimmen, werden sofort aus dem Cache bereitgestellt – es ist kein API-Aufruf erforderlich.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

Das TM ist der wichtigste Mechanismus zur Kosteneinsparung. Wenn Sie die Synchronisierung nach der Änderung eines einzelnen Schlüssels erneut ausführen, wird nur dieser eine Schlüssel übersetzt, nicht die gesamte Datei. Weitere Details finden Sie unter [Translation Memory](/docs/concepts/translation-memory).

Um den Cache für einen einzelnen Durchlauf zu umgehen: `i18n-rosetta sync --no-tm`

### 5. Übersetzung

Jeder Stapel wird an die konfigurierte Übersetzungsmethode gesendet:

- **`llm`**: Strukturierter Prompt an OpenRouter mit Anweisungen zu Register und geschlechtersensibler Sprache
- **`llm-coached`**: Dasselbe, jedoch mit eingefügten Grammatikregeln, Wörterbuch und Stilhinweisen
- **`google-translate`**: Stapelanfrage an die Google Cloud Translation API v2
- **`api`**: HTTP POST an einen Remote-Endpunkt

Die Systemnachricht (Register, geschlechtersensible Sprache, Regeln) ist für eine bestimmte Sprache über alle Stapel hinweg identisch, was **Prompt-Caching** ermöglicht – Anbieter wie Anthropic und Google zwischenspeichern wiederholte Systemnachrichten, wodurch die Token-Kosten gesenkt werden.

### 6. Quality Gate

Jede Übersetzung wird validiert, bevor sie auf die Festplatte geschrieben wird. Es werden fünf Prüfungen durchgeführt:

| Prüfung | Was sie erkennt | Beispiel |
|-------|----------------|---------|
| **Leer/Blank** | Modell hat nichts zurückgegeben | `""` |
| **Quell-Echo** | Modell hat die englische Eingabe zurückgegeben | `"Welcome"` für Japanisch |
| **Halluzinationsschleife** | Wiederholte Trigramme | `"Qo' Qo' Qo' Qo'"` |
| **Längeninflation** | Ausgabe ist 4×+ länger als die Quelle | 10-Zeichen-Quelle → 50-Zeichen-Ausgabe |
| **Schrift-Konformität** | Falsches Schriftsystem für die Sprache | Lateinischer Text für arabische Sprache |

Fehler werden mit einem `[GATE]`-Präfix protokolliert. Es gibt keine stillen Fallbacks.

Weitere Details finden Sie unter [Quality Gate](/docs/concepts/quality-gate).

### 6b. Terminologieprüfung

Für gecoachte Paare mit einem Wörterbuch prüft rosetta nach der Übersetzung, ob das LLM die erforderliche Terminologie tatsächlich verwendet hat. Verstöße werden als `[TERM]`-Warnungen protokolliert:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Dies sind Warnungen, keine blockierenden Fehler – die Übersetzung wird dennoch geschrieben.

### 7. Wiederholungskaskade

Bei JSON-Parsing-Fehlern oder Fehlern auf Stapelebene unternimmt rosetta erneute Versuche mit zunehmend kleineren Stapeln:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

Das Budget für erneute Versuche ist durch `maxRetries` begrenzt (Standard: 3), um ausufernde Token-Ausgaben zu verhindern.

### 8. Schreiben & Sperren

Erfolgreiche Übersetzungen werden in die Zielsprachendatei geschrieben, wobei die ursprüngliche Verschachtelungsstruktur erhalten bleibt. Die Sperrdatei wird mit neuen SHA-256-Hashes aktualisiert.

### 9. Verifizierung

Nachdem alle Paare verarbeitet wurden, liest rosetta die geschriebenen Sprachendateien erneut von der Festplatte und führt einen Verifizierungsdurchlauf durch (es sei denn, `--no-verify` ist festgelegt). Dies schließt die Lücke zwischen einer als erfolgreich gemeldeten Synchronisierung und tatsächlich fehlerhaften Schlüsseln:

- **Schlüsselparität** — alle Quellschlüssel sind in jedem Ziel vorhanden
- **`[EN]` Fallback-Markierungen** — veraltete Markierungen aus früheren Durchläufen
- **Leere Übersetzungen** — leere Werte, die durchgerutscht sind
- **Schrift-Konformität** — nicht-lateinische Sprachen mit reinen ASCII-Übersetzungen
- **Erhalt von Platzhaltern** — ICU-Platzhalter stimmen mit der Quelle überein
- **Codierungsprobleme** — BOM-Markierungen, unsichtbare Zeichen

Dies ist auch als eigenständiger Befehl `i18n-rosetta verify` für CI-Gates verfügbar.

## Inhaltsübersetzung (Phase 2)

Für Docusaurus- und Hugo-Projekte führt `sync` nach der Übersetzung der JSON-Schlüssel eine zweite Phase aus. In dieser Phase werden Markdown- und MDX-Dateien (Dokumentationen, Blogbeiträge, Tutorials) mit denselben Methoden und demselben Quality Gate übersetzt.

### Wie es funktioniert

1. Rosetta ermittelt alle Quellinhaltsdateien (`.md`, `.mdx`), indem es das content/docs-Verzeichnis durchsucht
2. Für jedes Paar aus Datei × Sprache wird eine separate Inhalts-Sperrdatei (`.i18n-rosetta-content.lock`) auf Änderungen der SHA-256-Hashes geprüft
3. Geänderte oder fehlende Dateien werden in einem flachen Pool von Arbeitselementen gesammelt
4. Der Pool wird mit **paralleler Nebenläufigkeit** verarbeitet (Standard: 12 gleichzeitige API-Aufrufe)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 48)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Parallelität

Sowohl Phase 1 (JSON-Schlüssel) als auch Phase 2 (Inhalte) laufen nun parallel ab:

- **Phase 1**: Alle Sprachübersetzungen werden gleichzeitig ausgeführt (Standard: 50 gleichzeitige Sprachen). Innerhalb jeder Sprache laufen auch die API-Stapel parallel (4 gleichzeitige Stapel). Eine Synchronisierung von 12 Sprachen mit 120 Schlüsseln ist in ca. 1 Minute statt in ca. 15 Minuten abgeschlossen.
- **Phase 2**: Alle Kombinationen aus Datei × Sprache werden als flacher Pool übersetzt (Standard: 12 gleichzeitige API-Aufrufe). Verschiedene Dateien und verschiedene Sprachen werden simultan übersetzt.

Steuern Sie die Parallelität mit `--json-concurrency`, `--content-concurrency` oder `--concurrency` (legt beides fest):

```bash
# Faster JSON sync (more parallel locale translations)
npx i18n-rosetta sync --json-concurrency 30

# Faster content sync (more parallel API calls)
npx i18n-rosetta sync --content-concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### Inhaltsschutz

Während der Übersetzung schützt rosetta nicht übersetzbare Inhalte:

- **Codeblöcke** (umzäunt und eingerückt) werden durch Platzhalter ersetzt
- **Frontmatter**-Felder, die nicht in der `translatableFields`-Liste stehen, bleiben unverändert erhalten
- **Links**, Bildpfade und HTML-Tags werden geschützt
- **Shortcodes** und Interpolationsvariablen (z. B. `{count}`, `{{.Params.title}}`) werden abgeschirmt

Nach der Übersetzung werden alle Platzhalter wiederhergestellt und validiert. Wenn welche fehlen oder beschädigt sind, wird die Übersetzung abgelehnt und erneut versucht.

## Teilerfolg

Ein fehlgeschlagener Stapel blockiert nicht den Rest. Wenn 9 von 10 Stapeln erfolgreich sind, werden diese 9 geschrieben. Der fehlgeschlagene Stapel wird protokolliert, und Sie können `sync` erneut ausführen, um einen neuen Versuch zu starten.

## Probelauf

Zeigen Sie eine Vorschau der Änderungen an, ohne Dateien zu schreiben:

```bash
npx i18n-rosetta sync --dry-run
```

## Neuübersetzung erzwingen

Erzwingen Sie die Neuübersetzung bestimmter Schlüssel, auch wenn diese unverändert sind:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Kostenschätzung

Vor der Übersetzung erstellt rosetta einen **Kostenbericht vor der Synchronisierung**, der die geschätzten Kosten pro Paar anzeigt. Dieser wird bei jedem `sync` automatisch ausgeführt – Sie sehen ihn, bevor API-Aufrufe getätigt werden.

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

Jede Übersetzungsmethode liefert ihre eigene Kostenschätzung:

| Methode | Kostenbasis | Präzision |
|--------|-----------|-----------|
| `google-translate` | Veröffentlichter Tarif von Google (20 $/Million Zeichen) | Genau |
| `llm` | Variiert je nach OpenRouter-Modell | Modellabhängig — siehe [OpenRouter-Preise](https://openrouter.ai/models) |
| `llm-coached` | Wie `llm` zuzüglich Coaching-Kontext-Token | Modellabhängig |
| `api` | Serverbestimmt | Unbekannt — kann ohne Abfrage des Endpunkts nicht geschätzt werden |

Wenn eine Methode die Kosten nicht ermitteln kann (LLM-Methoden, Remote-APIs), meldet rosetta `—`, anstatt zu raten. Verwenden Sie `--dry`, um Kostenschätzungen anzuzeigen, ohne tatsächlich zu übersetzen.

---

## Siehe auch

- [CLI-Referenz — sync](/docs/reference/cli#sync) — Befehls-Flags und Optionen
- [Translation Memory](/docs/concepts/translation-memory) — Caching und Kosteneinsparungen
- [Quality Gate](/docs/concepts/quality-gate) — wie Übersetzungen validiert werden
- [Übersetzungsmethoden](/docs/guides/translation-methods) — wie jede Methode funktioniert
- [Zusammenarbeit mit professionellen Übersetzern](/docs/guides/professional-translators) — XLIFF-Workflow
- [Konfiguration](/docs/getting-started/configuration) — Konfigurationsreferenz
- [CI/CD-Leitfaden](/docs/guides/ci-cd) — Automatisierung von Synchronisierungen in Ihrer Pipeline