---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Jede Übersetzung durchläuft ein deterministisches Validierungs-Gate, bevor sie auf die Festplatte geschrieben wird. Das Quality Gate fängt häufige Fehlerarten maschineller Übersetzungen ab — keine stillen Ausweichlösungen, kein Datenmüll, der in Ihre Locale-Dateien geschrieben wird.

## Validierungsprüfungen

| Prüfung | Was sie abfängt | Gate-Bezeichnung |
|-------|----------------|-----------|
| **Leer/Leerzeichen** | Das Modell hat eine leere Zeichenfolge oder Leerzeichen zurückgegeben | `[GATE] empty` |
| **Quelltext-Echo** | Das Modell hat die ursprüngliche englische Eingabe zurückgegeben | `[GATE] source-echo` |
| **Halluzinationsschleife** | Wiederholte Trigramm-Muster (z. B. `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Längeninflation** | Die Ausgabe ist deutlich länger als der Quelltext | `[GATE] length` |
| **Schriftsystem-Konformität** | Falsches Schriftsystem für das Ziel-Locale | `[GATE] script` |

### Leer/Leerzeichen

Weist Übersetzungen ab, die leere Zeichenfolgen, nur Leerzeichen oder `null` sind. Dies fängt Modelle ab, die für schwierige Schlüssel nichts zurückgeben.

### Quelltext-Echo

Erkennt, wenn das Modell den englischen Quelltext zurückgibt, anstatt ihn zu übersetzen. Häufig bei kurzen Zeichenfolgen und unzureichend spezifizierten Prompts.

### Halluzinationsschleife

Analysiert Trigramm-Muster (3-Zeichen-Muster) in der Ausgabe. Wenn sich ein Trigramm im Verhältnis zur Ausgabelänge häufiger als ein bestimmter Schwellenwert wiederholt, wird die Übersetzung abgewiesen. Dies fängt degenerierte Ausgaben wie `"Qo' Qo' Qo' Qo' Qo'"` ab.

### Längeninflation

Weist Übersetzungen ab, bei denen die Ausgabelänge `maxLengthRatio × source length` überschreitet (Standard: 4×). Dies fängt Modell-Halluzinationen ab, die für eine kurze Eingabe riesige Textblöcke erzeugen.

Konfigurierbar über `maxLengthRatio` in Ihrer Konfiguration.

### Schriftsystem-Konformität

Für Locales mit einem konfigurierten `script`-Feld (z. B. `"script": "cans"` für Plains Cree Syllabics) wird validiert, dass die Ausgabe Nicht-ASCII-Zeichen enthält, die für das Ziel-Schriftsystem angemessen sind. Eine rein lateinische Ausgabe für ein arabisches, CJK- oder silbenbasiertes Locale wird abgewiesen.

## Was bei einem Fehler passiert

1. Die fehlerhafte Übersetzung wird mit einem `[GATE]`-Präfix, dem Schlüsselnamen, dem Grund und einer Vorschau des Wertes in stderr protokolliert.
2. Der Schlüssel wird **nicht** in die Locale-Datei geschrieben.
3. Die Wiederholungskaskade setzt ein (siehe unten).

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Wiederholungskaskade

Wenn ein Batch fehlschlägt (JSON-Parsing-Fehler oder Abweisungen durch das Quality Gate), unternimmt rosetta erneute Versuche mit zunehmend kleineren Batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Das Budget für erneute Versuche ist durch `maxRetries` begrenzt (Standard: 3, pro Sprache konfigurierbar). Dies verhindert ausufernde Token-Ausgaben für Schlüssel, die durchgängig fehlschlagen.

Nach Ausschöpfen der erneuten Versuche werden die problematischen Schlüssel protokolliert und übersprungen. Sie werden beim nächsten `sync`-Durchlauf erneut versucht.

## Prompt-Caching

Die Systemnachricht (Register, Grammatikregeln, Stilhinweise) wird von der Benutzernachricht (die zu übersetzenden Schlüssel) getrennt. Diese Trennung ist beabsichtigt:

- Die Systemnachricht ist für ein bestimmtes Locale **über alle Batches hinweg identisch**.
- Anbieter wie Anthropic und Google speichern wiederholte Systemnachrichten im Cache.
- Ergebnis: Der erste Batch zahlt die vollen Token-Kosten, nachfolgende Batches zahlen nur für die Benutzernachricht.

Dies kann die Token-Kosten für Projekte mit vielen Batches erheblich senken.

---

## Siehe auch

- [Wie die Synchronisierung funktioniert](/docs/concepts/how-sync-works) — wo sich das Quality Gate in die Pipeline einfügt
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Methoden, die in das Gate einspeisen
- [Schriftsystem-Konverter](/docs/concepts/script-converters) — Schriftsystem-Konvertierung nach dem Gate
- [Coaching-Daten](/docs/concepts/coaching-data) — Verbesserung der Übersetzungsqualität im Vorfeld
- [CLI-Referenz — sync](/docs/reference/cli#sync) — Sync-Flags einschließlich des Wiederholungsverhaltens