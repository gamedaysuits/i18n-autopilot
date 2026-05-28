---
sidebar_position: 4
title: "Sicherheit"
---
# Sicherheit und Schutz

Rosetta wurde entwickelt, um in feindseligen Umgebungen sicher zu sein — in denen Lokalisierungsdaten aus nicht vertrauenswürdigen Quellen stammen könnten, manipulierte Dateinamen Verzeichnisgrenzen überschreiten könnten und LLM-Ausgaben beliebige Inhalte enthalten können.

## Bedrohungsmodell

| Bedrohung | Angriffsvektor | Abwehr |
|--------|--------------|-----------|
| **Prototype Pollution** | Manipulierte JSON-Schlüssel (`__proto__`, `constructor`) | Beim Parsen abgelehnt |
| **Path Traversal** | Locale-Codes wie `../../etc/passwd` | Dateischreibvorgänge auf konfigurierte Verzeichnisse validiert |
| **Beschädigung von Codeblöcken** | LLM übersetzt innerhalb von Code-Blöcken | Abschirmung durch Unicode-Sentinels |
| **Halluzinierte Schlüssel** | LLM gibt Schlüssel zurück, die nicht gesendet wurden | Antwortvalidierung — nur akzeptierte Schlüssel werden geschrieben |
| **Unkontrollierter Token-Verbrauch** | Endlose Wiederholungsschleifen | Budgetbegrenzt durch `maxRetries` |

## Schutz vor Prototype Pollution

Alle Locale-Schlüssel werden vor der Verarbeitung gegen eine Sperrliste validiert:

- `__proto__`
- `constructor`
- `prototype`

Jeder Schlüssel, der diesen Mustern entspricht, wird mit einem Fehler abgelehnt. Dies hindert Angreifer daran, manipulierte Locale-Dateien zu verwenden, um JavaScript-Objekt-Prototypen zu verändern.

## Pfad-Isolierung

Beim Schreiben von Locale-Dateien validiert rosetta, dass der Ausgabepfad innerhalb der konfigurierten Verzeichnisse bleibt (`localesDir`, `contentDir`). Locale-Codes werden bereinigt — ein Code wie `../../secrets` kann nicht außerhalb des erwarteten Verzeichnisses schreiben.

## Schutz von Blöcken

Während der Übersetzung von Markdown-Inhalten werden strukturierte Elemente durch Unicode-Sentinel-Platzhalter ersetzt, bevor der Text an das LLM gesendet wird:

1. **Codeblöcke** (eingefasst und inline) → Sentinel
2. **Hugo-Shortcodes** (`{{< >}}`, `{{% %}}`) → Sentinel  
3. **Reines HTML** → Sentinel
4. **Interpolationsvariablen** (`{{ .Count }}`) → Sentinel

Nach der Übersetzung werden die Sentinels wieder durch den ursprünglichen Inhalt ersetzt. Das LLM sieht niemals Codeblöcke, Shortcodes oder HTML — es kann diese somit nicht beschädigen.

## Antwortvalidierung

Wenn das LLM eine JSON-Antwort zurückgibt, validiert rosetta Folgendes:
- Nur Schlüssel, die im Batch gesendet wurden, erscheinen in der Antwort
- Es werden keine zusätzlichen Schlüssel eingeschleust
- Die Antwort lässt sich als gültiges JSON parsen

Halluzinierte Schlüssel werden stillschweigend verworfen. Dies verhindert, dass LLM-Ausgaben unerwartete Übersetzungen in Ihre Locale-Dateien einschleusen.

## Quality Gate

Jede Übersetzung wird durch fünf deterministische Prüfungen validiert, bevor sie auf die Festplatte geschrieben wird. Weitere Details finden Sie unter [Quality Gate](/docs/concepts/quality-gate).

## Exponentielles Backoff

API-Aufrufe verwenden ein exponentielles Backoff mit Jitter bei 429 (Ratenbegrenzung) und 5xx (Serverfehler) Antworten. Drei Wiederholungsversuche mit zunehmender Verzögerung verhindern, dass die API während Ausfällen überlastet wird.

## Request-Timeout

Jede API-Anfrage hat ein 30-Sekunden-Timeout über `AbortController`. Dies verhindert, dass der Synchronisationsprozess bei einer toten Verbindung auf unbestimmte Zeit hängen bleibt.

## Fail-Loud bei Übersetzungsfehlern

Wenn die API nicht verfügbar ist oder eine Übersetzung fehlschlägt, gibt rosetta einen deutlichen Fehler mit handlungsorientierten Anweisungen aus, anstatt stillschweigend unbrauchbare Daten zu schreiben. Während der Synchronisation werden niemals Platzhalter mit dem Präfix `[EN]` geschrieben.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

Das Fehlschlagen einer einzelnen Datei stoppt nicht die gesamte Synchronisation — der Fehler wird protokolliert und die Pipeline fährt mit der nächsten Datei fort, sodass Sie pro Durchlauf maximalen Fortschritt erzielen.

## Post-Sync-Verifizierung

Nach Abschluss aller Übersetzungen liest rosetta die geschriebenen Locale-Dateien erneut von der Festplatte und führt einen Verifizierungsdurchlauf durch. Dies schließt die Lücke zwischen einer als erfolgreich gemeldeten Synchronisation und tatsächlich fehlerhaften Übersetzungen:

- **Schlüsselparität** — alle Quellschlüssel sind in jedem Ziel vorhanden
- **`[EN]`-Markierungen** — veraltete Fallback-Markierungen aus früheren Durchläufen
- **Leere Übersetzungen** — leere Werte, die durchgerutscht sind
- **Skript-Konformität** — nicht-lateinische Locales mit reinen ASCII-Übersetzungen
- **Erhaltung von Platzhaltern** — ICU-Platzhalter stimmen mit der Quelle überein

Überspringen Sie dies mit `--no-verify` oder führen Sie es eigenständig mit `npx i18n-rosetta verify` aus.

## Tests

Sicherheitseigenschaften werden durch die Adversarial-Test-Suite verifiziert:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Siehe auch

- [Architektur](/docs/concepts/architecture) — wie das dreiteilige Ökosystem miteinander verbunden ist
- [CLI-Referenz — integrity](/docs/reference/cli#integrity) — Befehl zur Integritätsprüfung
- [CLI-Referenz — provenance](/docs/reference/cli#provenance) — Befehl zur Herkunftsprüfung
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — Herkunftsfelder in Plugin-Manifesten
- [Quality Gate](/docs/concepts/quality-gate) — Sicherheitsprüfungen auf Übersetzungsebene