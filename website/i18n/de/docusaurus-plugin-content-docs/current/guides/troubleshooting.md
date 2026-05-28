---
sidebar_position: 6
title: "Fehlerbehebung"
---
# Fehlerbehebung

Häufige Probleme und Lösungen für i18n-rosetta.

## API & Authentifizierung

### "OPENROUTER_API_KEY not found"

Rosetta benötigt einen API-Schlüssel für die LLM-Übersetzung. Legen Sie diesen als Umgebungsvariable fest:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Oder in einer `.env`-Datei (falls Ihr Projekt `.env`-Dateien lädt):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Wenn Sie nur über einen Google Translate API-Schlüssel verfügen, erkennt rosetta dies automatisch und verwendet Google Translate als Standardmethode. Es ist keine Änderung der Konfiguration erforderlich.
:::

### "401 Unauthorized" von OpenRouter

Ihr API-Schlüssel ist ungültig oder abgelaufen. Überprüfen Sie ihn unter [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Ratenbegrenzung

Rosetta behandelt Ratenbegrenzungen intern mit einem exponentiellen Backoff. Wenn Sie regelmäßig an Ratenbegrenzungen stoßen:

1. **Reduzieren Sie die Stapelgröße** in Ihrer Konfiguration:
   ```json
   { "batchSize": 15 }
   ```
2. **Verwenden Sie ein Modell mit höheren Ratenbegrenzungen** (z. B. hat `google/gemini-3.5-flash` großzügige Limits)
3. **Verwenden Sie eine günstigere/schnellere Methode** für Sprachpaare mit hohem Volumen — Google Translate hat keine Ratenbegrenzungen:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Modell nicht gefunden / 404-Fehler

Direkte LLM-Anbieter (`openai`, `anthropic`, `gemini`) validieren Ihre Modell-Zeichenfolge bei der ersten Verwendung. Wenn Sie eine Warnung sehen:

**"looks like an OpenRouter path"** — Sie verwenden ein Modell im OpenRouter-Format (`google/gemini-3.5-flash`) bei einem direkten Anbieter. Direkte Anbieter verwenden reine Modellnamen:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Oder wechseln Sie zur Methode `llm`, um OpenRouter zu verwenden:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Sie senden ein Modell an den falschen Anbieter:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Das Modell ist möglicherweise veraltet oder falsch geschrieben. Rosetta ruft die aktuelle Modellliste des Anbieters ab und schlägt Alternativen vor. Überprüfen Sie die Dokumentation des Anbieters auf aktuelle Modellnamen.

:::tip Modelle veralten gelegentlich
Anbieter mustern Modellnamen regelmäßig aus. Wenn Übersetzungen nach einem Anbieter-Update plötzlich fehlschlagen, überprüfen Sie die Ausgabe von `[WARN]` — dort werden Ihnen aktuelle Alternativen angezeigt.
:::

## Übersetzungsqualität

### Übersetzungen geben die Ausgangssprache unverändert wieder

Das Quality Gate fängt dies ab. Wenn eine Übersetzung mit der englischen Quelle identisch ist, wird sie abgelehnt und erneut versucht. Wenn das Problem weiterhin besteht:

1. **Überprüfen Sie das Modell** — Einige Modelle erzielen bei bestimmten Sprachpaaren schlechte Ergebnisse
2. **Fügen Sie Anweisungen zum Sprachregister hinzu** — Teilen Sie dem Modell mit, welche Sprache es erzeugen soll:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Versuchen Sie ein anderes Modell** — Wechseln Sie von `gpt-4o-mini` zu `gpt-4o` oder `google/gemini-2.5-pro`

### Falsche Schriftausgabe (z. B. lateinischer Text für Japanisch)

Die Überprüfung der Schriftkonformität durch das Quality Gate fängt die meisten Fälle ab. Wenn das Problem weiterhin besteht:

- Stellen Sie sicher, dass der Gebietsschema-Code korrekt ist (`ja`, nicht `jp`)
- Fügen Sie explizite Schriftanweisungen im Feld `register` hinzu:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Halluzinationsmuster in der Ausgabe

Wiederholte Trigramm-Muster (z. B. "hallo hallo hallo") werden vom Detektor für Halluzinationsschleifen erfasst. Wenn die Ausgabe fehlerhaft ist, den Detektor aber passiert:

1. **Reduzieren Sie die Stapelgröße** — Kleinere Stapel erzeugen fokussiertere Ausgaben
2. **Verwenden Sie ein leistungsstärkeres Modell** — Größere Modelle halluzinieren bei nicht-lateinischen Schriften weniger
3. **Fügen Sie Trainingsdaten hinzu** — Wörterbuchbegriffe verankern die Übersetzung

## Datei- und Formatprobleme

### "No locale files found"

Rosetta erkennt Gebietsschema-Dateien automatisch. Wenn diese nicht gefunden werden können:

1. **Überprüfen Sie `localesDir`** — Muss auf das Verzeichnis verweisen, das die Gebietsschema-Dateien enthält:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Überprüfen Sie die Dateibenennung** — Dateien müssen nach dem Gebietsschema-Code benannt sein: `en.json`, `fr.json` usw.
3. **Überprüfen Sie das Format** — Unterstützte Formate: JSON, verschachteltes JSON, YAML, TOML

### Konflikte mit der Sperrdatei

Wenn `.i18n-rosetta.lock` in einen fehlerhaften Zustand gerät:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Das Löschen der Sperrdatei bedeutet, dass bei der nächsten Synchronisierung alle Schlüssel neu übersetzt werden, nicht nur die geänderten. Dies hat Auswirkungen auf die API-Kosten bei großen Projekten.
:::

### Bestimmte Schlüssel neu übersetzen

Wenn einzelne Übersetzungen falsch sind und Sie eine Neuübersetzung erzwingen möchten, ohne die Sperrdatei zu löschen:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

Das Flag `--force-keys` überschreibt die Hash-Überprüfung der Sperrdatei für diese spezifischen Schlüssel und erzwingt eine Neuübersetzung, ohne andere Schlüssel zu beeinträchtigen.

### Inhaltsübersetzung beschädigt Codeblöcke

Dies sollte nicht passieren — Codeblöcke werden vor der Übersetzung abgeschirmt. Falls es dennoch auftritt:

1. Stellen Sie sicher, dass der Codeblock die Standard-Begrenzung (dreifache Backticks) verwendet
2. Suchen Sie nach nicht geschlossenen Codeblöcken im Quell-Markdown
3. Erstellen Sie ein Issue — dies ist ein Fehler im Sentinel-Abschirmsystem

## CLI-Probleme

### `--watch` erkennt keine Änderungen

Die Dateiüberwachung verwendet das native `fs.watch` von Node.js. Bekannte Probleme:

- **Netzwerklaufwerke** — `fs.watch` funktioniert auf NFS/SMB-Freigaben nicht zuverlässig
- **Docker-Volumes** — Verwenden Sie den Polling-Modus oder führen Sie rosetta innerhalb des Containers aus
- **Große Verzeichnisse** — Der Watcher überwacht `localesDir` rekursiv; sehr tiefe Verzeichnisbäume können die Limits des Betriebssystems überschreiten

### `npx` führt eine alte Version aus

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Oder installieren Sie es global:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Leistung

### Synchronisierung ist bei vielen Sprachen langsam

Rosetta übersetzt standardmäßig alle Gebietsschemata parallel. Wenn die Synchronisierung dennoch langsam ist:

1. **Verwenden Sie Google Translate für Sprachpaare mit hohem Volumen** — Es ist 10–50× schneller als die LLM-Übersetzung
2. **Erhöhen Sie die Stapelgröße** (Standard ist 80):
   ```json
   { "batchSize": 120 }
   ```
3. **Passen Sie die Nebenläufigkeit an** — Die Parallelität für JSON-Gebietsschemata ist standardmäßig auf 200 und für Inhalte auf 48 eingestellt. Wenn Ihr API-Anbieter höhere Ratenbegrenzungen unterstützt:
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **Verwenden Sie ein schnelles Modell** — `gpt-4o-mini` ist deutlich schneller als `gpt-4o`

### Hohe API-Kosten

- **Überprüfen Sie die Stapelgrößen** — Größere Stapel = weniger API-Aufrufe = geringere Kosten
- **Verwenden Sie Translation Memory** — TM ist standardmäßig aktiviert. Führen Sie `i18n-rosetta tm stats` aus, um zu überprüfen, ob es funktioniert. Wenn Sie nach mehreren Synchronisierungen 0 Einträge sehen, stimmt möglicherweise etwas mit den Berechtigungen Ihres `.rosetta/`-Verzeichnisses nicht
- **Verwenden Sie Prompt-Caching** — Rosetta teilt System-/Benutzernachrichten auf, um Cache-Treffer bei Anthropic- und Google-Modellen zu erzielen
- **Verwenden Sie Google Translate für Tier-2-Sprachen** — Siehe das Kochbuch [30 Sprachen übersetzen](/docs/tutorials/translate-30-languages)

### Veraltete Übersetzungen nach Anbieterwechsel

Wenn Sie von einer Übersetzungsmethode zu einer anderen wechseln (z. B. von `llm` zu `deepl`), liefert der TM-Cache möglicherweise weiterhin alte Übersetzungen der vorherigen Methode für Schlüssel, deren Quelltext sich nicht geändert hat. Der Cache-Schlüssel enthält den Methodennamen, sodass die meisten Fälle automatisch behandelt werden. Wenn Sie jedoch `model` innerhalb derselben Methode geändert haben:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Weitere Details zum Design der Cache-Schlüssel finden Sie unter [Translation Memory](/docs/concepts/translation-memory).

## Kommen Sie nicht weiter?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Durchsuchen Sie bestehende Issues oder erstellen Sie ein neues
- **[Architektur-Dokumentation](/docs/concepts/architecture)** — Verstehen Sie das Systemdesign
- **[Quality Gate](/docs/concepts/quality-gate)** — Wie die Validierung im Hintergrund funktioniert