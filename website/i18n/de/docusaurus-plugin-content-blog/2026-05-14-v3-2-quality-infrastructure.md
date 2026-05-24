---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Industrietaugliche Qualitätsinfrastruktur"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0 ist das Qualitäts-Release. 702 Tests, 163 Test-Suites, Nulltoleranz für stille Fehler.

<!-- truncate -->

## Änderungen

### Quality Gate (5 Prüfungen)

Jede Übersetzung durchläuft nun fünf deterministische Validierungsprüfungen, bevor sie auf den Datenträger geschrieben wird:

1. **Leer/Ohne Inhalt** — Das Modell hat nichts zurückgegeben
2. **Quelltext-Echo** — Das Modell hat die englische Eingabe zurückgegeben
3. **Halluzinationsschleife** — Wiederholte Trigramm-Muster
4. **Längeninflation** — Ausgabe ist 4×+ länger als der Quelltext
5. **Schriftsystem-Konformität** — Falsches Schriftsystem für das Gebietsschema

Keine Übersetzung wird gespeichert, ohne alle fünf Prüfungen bestanden zu haben. Fehlgeschlagene Übersetzungen werden protokolliert und erneut ausgeführt.

### Wiederholungskaskade

Wenn ein Batch fehlschlägt, führt rosetta erneute Versuche mit zunehmend kleineren Batches durch:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Sicherheitshärtung

- **Prototype-Pollution-Schutz** — `__proto__`, `constructor` Schlüssel werden zur Parse-Zeit abgelehnt
- **Path-Traversal-Schutz** — Manipulierte Gebietsschema-Codes können nicht außerhalb der konfigurierten Verzeichnisse schreiben
- **Antwortvalidierung** — Nur Schlüssel, die gesendet wurden, werden als Antwort akzeptiert

### Testinfrastruktur

| Suite | Tests | Abgedeckte Bereiche |
|-------|-------|---------------|
| Core (8 Suites) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red Team | 89 | Manipulierte Eingaben, Encoding-Angriffe |
| Contract | 120 | API-Integrationsverträge |
| Performance | 36 | Batch-Optimierung, Durchsatzregression |
| Abdeckung | 702 insgesamt | Vollständige Pipeline |

### Prompt-Caching

Systemnachrichten werden nun von Benutzernachrichten getrennt, was Prompt-Cache-Treffer bei Anbietern wie Anthropic und Google ermöglicht. Dies reduziert die Token-Kosten für Multi-Batch-Synchronisationen erheblich.

Weitere technische Details entnehmen Sie bitte der [Quality-Gate-Dokumentation](/docs/concepts/quality-gate) und der [Sicherheitsdokumentation](/docs/concepts/security).