---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Jede Übersetzung durchläuft ein deterministisches Validierungs-Gate, bevor sie auf die Festplatte geschrieben wird. Das Quality Gate fängt häufige Fehlermodi der maschinellen Übersetzung ab — keine stillen Fallbacks, kein Datenmüll, der in Ihre Locale-Dateien geschrieben wird.

## Validierungsprüfungen

| Prüfung | Was sie abfängt | Gate-Label |
|-------|----------------|-----------|
| **Leer/Blank** | Modell hat einen leeren String oder Leerzeichen zurückgegeben | `[GATE] empty` |
| **Quell-Echo** | Modell hat die ursprüngliche englische Eingabe zurückgegeben | `[GATE] source-echo` |
| **Halluzinationsschleife** | Wiederholte Trigramm-Muster (z. B. `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Längeninflation** | Ausgabe ist deutlich länger als die Quelle | `[GATE] length` |
| **Schrift-Konformität** | Falsche Schriftart für das Ziel-Locale | `[GATE] script` |

### Leer/Blank

Lehnt Übersetzungen ab, die leere Strings, nur Leerzeichen oder `null` sind. Dies fängt Modelle ab, die bei schwierigen Keys nichts zurückgeben.

### Quell-Echo

Erkennt, wenn das Modell den englischen Quelltext zurückgibt, anstatt ihn zu übersetzen. Häufig bei kurzen Strings und unzureichend spezifizierten Prompts.

### Halluzinationsschleife

Analysiert Trigramm-Muster (3 Zeichen) in der Ausgabe. Wenn sich ein Trigramm im Verhältnis zur Ausgabelänge häufiger als ein bestimmter Schwellenwert wiederholt, wird die Übersetzung abgelehnt. Dies fängt degenerierte Ausgaben wie `"Qo' Qo' Qo' Qo' Qo'"` ab.

### Längeninflation

Lehnt Übersetzungen ab, bei denen die Ausgabelänge `maxLengthRatio × source length` überschreitet (Standard: 4×). Dies fängt Modell-Halluzinationen ab, die bei einer kurzen Eingabe Textwände produzieren.

Konfigurierbar über `maxLengthRatio` in Ihrer Konfiguration.

### Schrift-Konformität

Für Locales mit einem konfigurierten `script`-Feld (z. B. `"script": "cans"` für Plains Cree Syllabics) wird validiert, dass die Ausgabe Nicht-ASCII-Zeichen enthält, die für die Zielschrift geeignet sind. Eine rein lateinische Ausgabe für ein arabisches, CJK- oder Syllabics-Locale wird abgelehnt.

## Was bei einem Fehler passiert

1. Die fehlerhafte Übersetzung wird mit einem `[GATE]`-Präfix, dem Key-Namen, dem Grund und einer Vorschau des Wertes in stderr protokolliert
2. Der Key wird **nicht** in die Locale-Datei geschrieben
3. Die Wiederholungskaskade (Retry Cascade) setzt ein (siehe unten)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Wiederholungskaskade

Wenn ein Batch fehlschlägt (JSON-Parsing-Fehler oder Ablehnungen durch das Quality Gate), unternimmt rosetta erneute Versuche mit zunehmend kleineren Batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Das Budget für Wiederholungsversuche wird durch `maxRetries` begrenzt (Standard: 3, pro Sprache konfigurierbar). Dies verhindert ausufernde Token-Ausgaben für Keys, die durchgehend fehlschlagen.

Nach Ausschöpfen der Wiederholungsversuche werden die problematischen Keys protokolliert und übersprungen. Sie werden beim nächsten `sync`-Lauf erneut versucht.

## Prompt-Caching

Die Systemnachricht (Register, Grammatikregeln, Stilhinweise) wird von der Benutzernachricht (die zu übersetzenden Keys) getrennt. Diese Trennung ist beabsichtigt:

- Die Systemnachricht ist für ein bestimmtes Locale **über alle Batches hinweg identisch**
- Anbieter wie Anthropic und Google cachen wiederholte Systemnachrichten
- Ergebnis: Der erste Batch zahlt die vollen Token-Kosten, nachfolgende Batches zahlen nur für die Benutzernachricht

Dies kann die Token-Kosten für Projekte mit vielen Batches erheblich reduzieren.