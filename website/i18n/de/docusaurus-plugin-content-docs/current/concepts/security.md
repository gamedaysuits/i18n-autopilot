---
sidebar_position: 4
title: "Sicherheit"
---
# Sicherheit & Schutz

Rosetta wurde entwickelt, um in feindlichen Umgebungen sicher zu sein – wo Locale-Daten aus nicht vertrauenswürdigen Quellen stammen könnten, wo manipulierte Dateinamen Verzeichnisgrenzen umgehen könnten und wo LLM-Ausgaben beliebige Inhalte aufweisen können.

## Bedrohungsmodell

| Bedrohung | Angriffsvektor | Abwehr |
|--------|--------------|-----------|
| **Prototype Pollution** | Manipulierte JSON-Schlüssel (`__proto__`, `constructor`) | Ablehnung zur Parse-Zeit |
| **Path Traversal** | Locale-Codes wie `../../etc/passwd` | Dateischreibvorgänge werden auf konfigurierte Verzeichnisse validiert |
| **Beschädigung von Codeblöcken** | LLM übersetzt innerhalb von Code-Blöcken | Abschirmung durch Unicode-Sentinels |
| **Halluzinierte Schlüssel** | LLM gibt Schlüssel zurück, die nicht gesendet wurden | Antwortvalidierung – nur akzeptierte Schlüssel werden geschrieben |
| **Unkontrollierter Token-Verbrauch** | Endlose Wiederholungsschleifen | Budgetbegrenzung über `maxRetries` |

## Schutz vor Prototype Pollution

Alle Locale-Schlüssel werden vor der Verarbeitung gegen eine Sperrliste validiert:

- `__proto__`
- `constructor`
- `prototype`

Jeder Schlüssel, der diesen Mustern entspricht, wird mit einem Fehler abgelehnt. Dies verhindert, dass Angreifer manipulierte Locale-Dateien verwenden, um JavaScript-Objekt-Prototypen zu verändern.

## Pfadbegrenzung

Beim Schreiben von Locale-Dateien validiert Rosetta, dass der Ausgabepfad innerhalb der konfigurierten Verzeichnisse bleibt (`localesDir`, `contentDir`). Locale-Codes werden bereinigt – ein Code wie `../../secrets` kann nicht außerhalb des erwarteten Verzeichnisses schreiben.

## Blockschutz

Während der Übersetzung von Markdown-Inhalten werden strukturierte Elemente durch Unicode-Sentinel-Platzhalter ersetzt, bevor der Text an das LLM gesendet wird:

1. **Codeblöcke** (eingefasst und inline) → Sentinel
2. **Hugo-Shortcodes** (`{{< >}}`, `{{% %}}`) → Sentinel  
3. **Rohes HTML** → Sentinel
4. **Interpolationsvariablen** (`{{ .Count }}`) → Sentinel

Nach der Übersetzung werden die Sentinels wieder durch den ursprünglichen Inhalt ersetzt. Das LLM sieht niemals Codeblöcke, Shortcodes oder HTML – es kann diese somit nicht beschädigen.

## Antwortvalidierung

Wenn das LLM eine JSON-Antwort zurückgibt, validiert Rosetta Folgendes:
- Nur Schlüssel, die im Batch gesendet wurden, erscheinen in der Antwort
- Es werden keine zusätzlichen Schlüssel eingeschleust
- Die Antwort lässt sich als gültiges JSON parsen

Halluzinierte Schlüssel werden stillschweigend verworfen. Dies verhindert, dass LLM-Ausgaben unerwartete Übersetzungen in Ihre Locale-Dateien einschleusen.

## Quality Gate

Jede Übersetzung wird durch fünf deterministische Prüfungen validiert, bevor sie auf die Festplatte geschrieben wird. Weitere Details finden Sie unter [Quality Gate](/docs/concepts/quality-gate).

## Exponentielles Backoff

API-Aufrufe verwenden ein exponentielles Backoff mit Jitter bei 429- (Ratenbegrenzung) und 5xx-Antworten (Serverfehler). Drei Wiederholungsversuche mit zunehmender Verzögerung verhindern, dass die API während Ausfällen überlastet wird.

## Anfrage-Timeout

Jede API-Anfrage hat ein 30-Sekunden-Timeout über `AbortController`. Dies verhindert, dass der Synchronisierungsprozess bei einer toten Verbindung auf unbestimmte Zeit hängen bleibt.

## Fallback-Modus

Wenn die API nicht verfügbar ist, schreibt `--fallback` Platzhalter mit dem Präfix `[EN]` anstelle von echten Übersetzungen:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Diese Platzhalter werden bei der nächsten Synchronisierung mit einem gültigen API-Schlüssel automatisch erkannt und neu übersetzt. Sie werden niemals als "übersetzt" behandelt – `audit` wird sie markieren.

## Tests

Die Sicherheitseigenschaften werden durch die adversarielle Test-Suite verifiziert:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Siehe auch

- [Architektur](/docs/concepts/architecture) – wie das dreiteilige Ökosystem zusammenhängt
- [CLI-Referenz – integrity](/docs/reference/cli#integrity) – Befehl zur Integritätsprüfung
- [CLI-Referenz – provenance](/docs/reference/cli#provenance) – Befehl zur Provenienzprüfung
- [Plugin-Spezifikation](/docs/reference/plugin-spec) – Provenienzfelder in Plugin-Manifesten
- [Quality Gate](/docs/concepts/quality-gate) – Sicherheitsprüfungen auf Übersetzungsebene