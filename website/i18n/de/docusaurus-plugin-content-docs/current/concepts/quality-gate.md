---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Jede Übersetzung durchläuft ein deterministisches Validierungs-Gate, bevor sie auf die Festplatte geschrieben wird. Das Quality Gate fängt häufige Fehlermodi maschineller Übersetzungen ab — keine stillschweigenden Fallbacks, kein Datenmüll, der in Ihre Lokalisierungsdateien geschrieben wird.

## Validierungsprüfungen

| Prüfung | Was sie abfängt | Gate-Label |
|-------|----------------|-----------|
| **Leer/Blank** | Modell hat eine leere Zeichenfolge oder Leerzeichen zurückgegeben | `[GATE] empty` |
| **Quell-Echo** | Modell hat die ursprüngliche englische Eingabe zurückgegeben | `[GATE] source-echo` |
| **Halluzinationsschleife** | Wiederholte Trigramm-Muster (z. B. `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Längeninflation** | Ausgabe ist deutlich länger als die Quelle | `[GATE] length` |
| **Schrift-Konformität** | Falsches Schriftsystem für das Ziel-Locale | `[GATE] script` |
| **ICU-Pluralkategorien** | Fehlende erforderliche Pluralformen für das Locale | `[GATE] icu-plural` |

### Leer/Blank

Weist Übersetzungen ab, die leere Zeichenfolgen, nur Leerzeichen oder `null` sind. Dies fängt Modelle ab, die für schwierige Schlüssel nichts zurückgeben.

### Quell-Echo

Erkennt, wenn das Modell den englischen Quelltext zurückgibt, anstatt ihn zu übersetzen. Häufig bei kurzen Zeichenfolgen und unzureichend spezifizierten Prompts.

### Halluzinationsschleife

Analysiert Trigramm-Muster (3 Zeichen) in der Ausgabe. Wenn sich ein Trigramm im Verhältnis zur Ausgabelänge häufiger als ein bestimmter Schwellenwert wiederholt, wird die Übersetzung abgewiesen. Dies fängt degenerierte Ausgaben wie `"Qo' Qo' Qo' Qo' Qo'"` ab.

### Längeninflation

Weist Übersetzungen ab, bei denen die Ausgabelänge `maxLengthRatio × source length` überschreitet (Standard: 4×). Dies fängt Modell-Halluzinationen ab, die für eine kurze Eingabe riesige Textblöcke erzeugen.

Konfigurierbar über `maxLengthRatio` in Ihrer Konfiguration.

### Schrift-Konformität

Für Locales mit einem konfigurierten `script`-Feld (z. B. `"script": "cans"` für Plains Cree Syllabics) wird validiert, dass die Ausgabe Nicht-ASCII-Zeichen enthält, die für das Ziel-Schriftsystem angemessen sind. Eine rein lateinische Ausgabe für ein arabisches, CJK- oder Syllabics-Locale wird abgewiesen.

## Was bei einem Fehler passiert

1. Die fehlerhafte Übersetzung wird mit einem `[GATE]`-Präfix, dem Schlüsselnamen, dem Grund und einer Vorschau des Wertes in stderr protokolliert.
2. Der Schlüssel wird **nicht** in die Lokalisierungsdatei geschrieben.
3. Die Wiederholungskaskade setzt ein (siehe unten).

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Wiederholungskaskade

Wenn ein Batch fehlschlägt (JSON-Parsing-Fehler oder Abweisungen durch das Quality Gate), versucht rosetta es mit zunehmend kleineren Batches erneut:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Das Budget für Wiederholungsversuche ist durch `maxRetries` begrenzt (Standard: 3, pro Sprache konfigurierbar). Dies verhindert ausufernde Token-Ausgaben für Schlüssel, die durchgängig fehlschlagen.

Nach Ausschöpfen der Wiederholungsversuche werden die problematischen Schlüssel protokolliert und übersprungen. Sie werden beim nächsten `sync`-Lauf erneut versucht.

## Prompt Caching

Die Systemnachricht (Register, Grammatikregeln, Stilhinweise) wird von der Benutzernachricht (die zu übersetzenden Schlüssel) getrennt. Diese Trennung ist beabsichtigt:

- Die Systemnachricht ist für ein bestimmtes Locale **über alle Batches hinweg identisch**.
- Anbieter wie Anthropic und Google speichern wiederholte Systemnachrichten im Cache.
- Ergebnis: Der erste Batch zahlt die vollen Token-Kosten, nachfolgende Batches zahlen nur für die Benutzernachricht.

Dies kann die Token-Kosten für Projekte mit vielen Batches erheblich senken.

## ICU MessageFormat-Validierung

Der Befehl `integrity` validiert ICU MessageFormat-Pluralmuster anhand von CLDR-Pluralregeln. Wenn Ihre Quelldatei eine ICU-Syntax wie diese verwendet:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta überprüft, ob die übersetzten Versionen alle erforderlichen Pluralkategorien für das Ziel-Locale enthalten. Zum Beispiel erfordert Arabisch sechs Kategorien (`zero`, `one`, `two`, `few`, `many`, `other`) — nicht nur `one` und `other`.

Führen Sie `i18n-rosetta integrity` aus, um die Plural-Vollständigkeit über alle Locales hinweg zu überprüfen.

## Terminologiedurchsetzung

Für gecoachte Paare mit einem Wörterbuch führt rosetta nach der Übersetzung eine Terminologieprüfung durch. Nachdem das Quality Gate passiert wurde, wird überprüft, ob das LLM tatsächlich die erforderlichen Wörterbuchbegriffe verwendet hat.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Terminologieverstöße sind **Warnungen, keine blockierenden Fehler**. Die Übersetzung wird dennoch auf die Festplatte geschrieben. Dies ist beabsichtigt — das LLM hat möglicherweise triftige Gründe für die Wahl einer Alternative (Kontext, Grammatik), und ein Blockieren aufgrund von Begriffsabweichungen würde mehr schaden als nützen.

Um Verstöße zu beheben, aktualisieren Sie das Coaching-Wörterbuch oder bearbeiten Sie die Lokalisierungsdatei manuell.

---

## Siehe auch

- [Wie die Synchronisierung funktioniert](/docs/concepts/how-sync-works) — wo sich das Quality Gate in die Pipeline einfügt
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Methoden, die in das Gate einspeisen
- [Schrift-Konverter](/docs/concepts/script-converters) — Schriftkonvertierung nach dem Gate
- [Coaching-Daten](/docs/concepts/coaching-data) — Verbesserung der Übersetzungsqualität im Vorfeld
- [Translation Memory](/docs/concepts/translation-memory) — Zwischenspeicherung validierter Übersetzungen
- [CLI-Referenz — sync](/docs/reference/cli#sync) — Sync-Flags einschließlich Wiederholungsverhalten
- [CLI-Referenz — integrity](/docs/reference/cli#integrity) — ICU-Plural-Prüfung