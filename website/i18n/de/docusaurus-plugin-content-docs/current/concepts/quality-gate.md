---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Jede Übersetzung durchläuft eine deterministische Validierungsprüfung, bevor sie auf den Datenträger geschrieben wird. Das Quality Gate fängt häufige Fehlerquellen maschineller Übersetzungen ab — keine unbemerkten Ausweichlösungen, kein Datenmüll, der in Ihre Lokalisierungsdateien geschrieben wird.

## Validierungsprüfungen

| Prüfung | Was sie abfängt | Gate-Bezeichnung |
|-------|----------------|-----------|
| **Leer/Blank** | Modell hat eine leere Zeichenfolge oder Leerzeichen zurückgegeben | `[GATE] empty` |
| **Quelltext-Echo** | Modell hat die ursprüngliche englische Eingabe zurückgegeben | `[GATE] source-echo` |
| **Halluzinationsschleife** | Wiederholte Trigramm-Muster (z. B. `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Längeninflation** | Ausgabe ist deutlich länger als der Quelltext | `[GATE] length` |
| **Schrift-Konformität** | Falsches Schriftsystem für die Zielsprache | `[GATE] script` |
| **ICU-Pluralkategorien** | Fehlende erforderliche Pluralformen für die Zielsprache | `[GATE] icu-plural` |

### Leer/Blank

Weist Übersetzungen ab, die leere Zeichenfolgen, nur Leerzeichen oder `null` sind. Dies fängt Modelle ab, die für schwierige Schlüssel nichts zurückgeben.

### Quelltext-Echo

Erkennt, wenn das Modell den englischen Quelltext zurückgibt, anstatt ihn zu übersetzen. Häufig bei kurzen Zeichenfolgen und unzureichend spezifizierten Eingabeaufforderungen (Prompts).

### Halluzinationsschleife

Analysiert Trigramm-Muster (3 Zeichen) in der Ausgabe. Wenn sich ein Trigramm im Verhältnis zur Ausgabelänge häufiger als ein festgelegter Schwellenwert wiederholt, wird die Übersetzung abgewiesen. Dies fängt fehlerhafte Ausgaben wie `"Qo' Qo' Qo' Qo' Qo'"` ab.

### Längeninflation

Weist Übersetzungen ab, bei denen die Ausgabelänge `maxLengthRatio × source length` überschreitet (Standard: 4×). Dies fängt Modell-Halluzinationen ab, die bei einer kurzen Eingabe riesige Textblöcke erzeugen.

Konfigurierbar über `maxLengthRatio` in Ihrer Konfiguration.

### Schrift-Konformität

Für Zielsprachen mit einem konfigurierten `script`-Feld (z. B. `"script": "cans"` für die Silbenschrift der Plains Cree) wird validiert, dass die Ausgabe Nicht-ASCII-Zeichen enthält, die für das Ziel-Schriftsystem angemessen sind. Eine rein lateinische Ausgabe für eine arabische, CJK- oder Silbenschrift-Zielsprache wird abgewiesen.

## Was bei einem Fehler passiert

1. Die fehlgeschlagene Übersetzung wird mit einem `[GATE]`-Präfix, dem Schlüsselnamen, dem Grund und einer Vorschau des Wertes in stderr protokolliert.
2. Der Schlüssel wird **nicht** in die Lokalisierungsdatei geschrieben.
3. Die Wiederholungskaskade setzt ein (siehe unten).

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Wiederholungskaskade

Wenn ein Stapel fehlschlägt (JSON-Analysefehler oder Abweisungen durch das Quality Gate), versucht rosetta es mit schrittweise kleineren Stapeln erneut:

```
Full batch (80 keys) → parse error
  └→ Half batch (40 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Das Budget für Wiederholungsversuche ist durch `maxRetries` begrenzt (Standard: 3, pro Sprache konfigurierbar). Dies verhindert ausufernde Token-Ausgaben für Schlüssel, die durchgehend fehlschlagen.

Nach Ausschöpfung der Wiederholungsversuche werden die problematischen Schlüssel protokolliert und übersprungen. Sie werden beim nächsten `sync`-Durchlauf erneut versucht.

## Prompt-Caching

Die Systemnachricht (Register, Grammatikregeln, Stilhinweise) wird von der Benutzernachricht (die zu übersetzenden Schlüssel) getrennt. Diese Trennung ist beabsichtigt:

- Die Systemnachricht ist für eine bestimmte Zielsprache **über alle Stapel hinweg identisch**.
- Anbieter wie Anthropic und Google speichern wiederholte Systemnachrichten zwischen.
- Ergebnis: Für den ersten Stapel fallen die vollen Token-Kosten an, nachfolgende Stapel zahlen nur für die Benutzernachricht.

Dies kann die Token-Kosten für Projekte mit vielen Stapeln erheblich reduzieren.

## ICU-MessageFormat-Validierung

Der Befehl `integrity` validiert ICU-MessageFormat-Pluralmuster anhand der CLDR-Pluralregeln. Wenn Ihre Quelldatei die ICU-Syntax wie folgt verwendet:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta überprüft, ob die übersetzten Versionen alle erforderlichen Pluralkategorien für die Zielsprache enthalten. Zum Beispiel erfordert Arabisch sechs Kategorien (`zero`, `one`, `two`, `few`, `many`, `other`) — nicht nur `one` und `other`.

Führen Sie `i18n-rosetta integrity` aus, um die Vollständigkeit der Pluralformen über alle Zielsprachen hinweg zu überprüfen.

## Durchsetzung der Terminologie

Für trainierte Sprachpaare mit einem Wörterbuch führt rosetta nach der Übersetzung eine Terminologieprüfung durch. Nachdem das Quality Gate passiert wurde, wird überprüft, ob das LLM tatsächlich die erforderlichen Wörterbuchbegriffe verwendet hat.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Terminologieverstöße sind **Warnungen, keine blockierenden Fehler**. Die Übersetzung wird dennoch auf den Datenträger geschrieben. Dies ist beabsichtigt — das LLM hat möglicherweise triftige Gründe für die Wahl einer Alternative (Kontext, Grammatik), und eine Blockierung aufgrund von Begriffsabweichungen würde mehr Schaden als Nutzen anrichten.

Um Verstöße zu beheben, aktualisieren Sie das Trainingswörterbuch oder bearbeiten Sie die Lokalisierungsdatei manuell.

---

## Siehe auch

- [Wie die Synchronisierung funktioniert](/docs/concepts/how-sync-works) — wo sich das Quality Gate in die Pipeline einfügt
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Methoden, die in das Gate einfließen
- [Schrift-Konverter](/docs/concepts/script-converters) — Schriftkonvertierung nach dem Gate
- [Trainingsdaten](/docs/concepts/coaching-data) — Verbesserung der Übersetzungsqualität im Vorfeld
- [Translation Memory](/docs/concepts/translation-memory) — Zwischenspeicherung validierter Übersetzungen
- [CLI-Referenz — sync](/docs/reference/cli#sync) — Synchronisierungs-Flags einschließlich des Wiederholungsverhaltens
- [CLI-Referenz — integrity](/docs/reference/cli#integrity) — Überprüfung von ICU-Pluralformen