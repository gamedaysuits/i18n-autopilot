---
sidebar_position: 3
title: "Konfiguration"
---
# Konfiguration

Rosetta funktioniert ohne Konfiguration – es erkennt Lokalisierungsdateien, das Format und die Zielsprachen Ihres Projekts automatisch. Für mehr Kontrolle erstellen Sie `i18n-rosetta.config.json` im Stammverzeichnis Ihres Projekts oder führen Sie folgenden Befehl aus:

```bash
npx i18n-rosetta init
```

## Vollständige Konfigurationsreferenz

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 30,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen ist noch nicht implementiert
Der Konfigurationsblock `typegen` wird vom Konfigurationslader erkannt und beibehalten, aber die Generierung von TypeScript-Typen ist noch nicht implementiert. Dies ist ein Platzhalter für eine geplante Funktion. Das Festlegen dieser Werte hat keine Auswirkungen.
:::


### Felder

| Feld | Typ | Standardwert | Beschreibung |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Version des Konfigurationsschemas. Immer `3`. |
| `inputLocale` | `string` | `"en"` | Quellsprachcode (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Pfad zu den Lokalisierungsdateien. Rosetta durchsucht dieses Verzeichnis. |
| `contentDir` | `string` | `null` | Hugo-Inhaltsverzeichnis. Aktiviert die Übersetzung des Markdown-Hauptteils (Body). |
| `translatableFields` | `string[]` | `null` | Überschreibt die standardmäßig übersetzbaren Frontmatter-Felder für die Inhaltsübersetzung. `null` verwendet integrierte Standardwerte (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | Dateiformat: `json`, `toml`, `yaml` oder `auto` (Erkennung anhand der Dateiendung). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Standardmodell für LLM-Methoden. Das Format hängt von der Methode ab: OpenRouter verwendet `provider/model` (z. B. `google/gemini-3.5-flash`); direkte Anbieter verwenden reine Namen (z. B. `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Standard-Übersetzungsmethode: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Wird durch das CLI-Flag `--method` überschrieben. |
| `batchSize` | `number` | `30` | Schlüssel pro Übersetzungsstapel (Batch). Höher = weniger API-Aufrufe, aber größere Prompts. |
| `fallbackPrefix` | `string` | `"[EN] "` | Präfix, das unübersetzten Fallback-Werten hinzugefügt wird. Wird von `audit` verwendet, um unvollständige Übersetzungen zu erkennen. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Name der Umgebungsvariable für den API-Schlüssel. Überschreiben Sie dies für benutzerdefinierte Namen von Umgebungsvariablen. |
| `baseUrl` | `string` | `""` | Basis-URL für die Generierung von SEO-Artefakten (hreflang, Sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Überschreibungen für Methode, Modell und Qualität pro Sprachpaar. Siehe [Paar-Konfiguration](#pair-configuration). |
| `languages` | `object` | `{}` | Überschreibungen pro Sprache. Siehe [Sprachkonfiguration](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Quellverzeichnis für den Lint-Scan. `null` = automatische Erkennung anhand des Frameworks. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Glob-Muster, die vom Linting ausgeschlossen werden sollen. |
| `lint.minLength` | `number` | `2` | Minimale Zeichenfolgenlänge, um als fest codiert (hardcoded) markiert zu werden. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | URL-Muster-Vorlage für die Generierung von hreflang-Tags. |
| `seo.pages` | `string[]` | `null` | Explizite Seitenliste für SEO. `null` = automatische Erkennung anhand der Lokalisierungsschlüssel. |
| `typegen.output` | `string` | `null` | Ausgabepfad für generierte TypeScript-Typen. `null` = deaktiviert. |
| `typegen.autoGenerate` | `boolean` | `false` | Automatische Neugenerierung der Typen nach jeder Synchronisierung. |

## Paar-Konfiguration

Jedes Quelle→Ziel-Paar kann unabhängig konfiguriert werden:

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### Paar-Felder

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `method` | `string` | Übersetzungsmethode: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Name eines installierten Plugins (aus `.rosetta/methods/`) |
| `model` | `string` | Überschreibt das Standardmodell für dieses Paar |
| `endpoint` | `string` | URL des Remote-API-Endpunkts. Erforderlich, wenn `method` auf `api` gesetzt ist. |
| `qualityTier` | `string` | Anzeige-Stufe (Tier): `standard`, `high`, `research`, `verified` |

## Sprachkonfiguration

Sprachen akzeptieren drei Formate:

### Array von Codes (am einfachsten)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Jede Sprache erhält ihr Standardregister aus der integrierten Registertabelle. Sprachen ohne Standardwert erhalten `"Professional register."`.

### Objekt mit Register-Zeichenfolgen

Der Wert kann ein **Voreinstellungsschlüssel** (Preset Key) aus der Sprachkarte oder ein benutzerdefinierter Registertext sein:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta prüft, ob die Zeichenfolge mit einem Voreinstellungsschlüssel in der Sprachkarte übereinstimmt. Ist dies der Fall, wird der vollständige Register-Prompt aus der Karte verwendet. Wenn nicht, wird die Zeichenfolge unverändert übernommen. Siehe [Unterstützte Sprachen](/docs/reference/supported-languages#language-cards) für verfügbare Voreinstellungen.

### Objekt mit vollständiger Konfiguration

```json
{
  "languages": {
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

Sie können Kurzschreibweisen und vollständige Objekte im selben Block mischen.


### Sprachfelder

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `register` | `string` | Anweisungen zu Stil/Tonfall. Kann ein **Voreinstellungsschlüssel** (z. B. `casual-tu`, `formal-hapsyo`) oder ein benutzerdefinierter Text sein. Siehe [Sprachkarten](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Für Menschen lesbarer Sprachname (für die Statusanzeige) |
| `model` | `string` | Überschreibt das Standardmodell |
| `batchSize` | `number` | Überschreibt die Standard-Stapelgröße (Batch Size) |
| `maxRetries` | `number` | Maximales Wiederholungsbudget für fehlgeschlagene Stapel (Standard: 3) |
| `script` | `string` | ISO 15924-Skriptcode. Löst die Skriptvalidierung im Quality Gate aus. |

:::info Vererbungskette
Einstellungen werden in dieser Reihenfolge aufgelöst (die erste gewinnt):

**Paar-Ebene** → **Sprach-Ebene** → **Globale Konfiguration** → **Standardwerte**

Wenn beispielsweise `pairs["en:fr"]` den Wert `model` festlegt, überschreibt dies sowohl die auf Sprachebene festgelegten als auch die globalen `model`-Werte.
:::

## Nicht-englische Quelle

Wenn Ihre Quellsprache nicht Englisch ist:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Lock-Datei

Rosetta erstellt `.i18n-rosetta.lock`, um SHA-256-Hashes der übersetzten Quellwerte zu verfolgen. **Committen Sie diese Datei**, damit alle Entwickler dieselbe Übersetzungsbasis teilen.

Wenn sich ein Quellwert ändert, stimmt der Hash nicht mehr überein, und Rosetta übersetzt diesen Schlüssel bei der nächsten Synchronisierung neu.

## `.rosettaignore`

Erstellen Sie `.rosettaignore` im Stammverzeichnis Ihres Projekts, um Dateien vom `lint`-Scan auszuschließen. Verwendet Glob-Muster, wie `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

---

## Programmatische API

Für Build-Skripte und benutzerdefinierte Integrationen importieren Sie direkt aus dem Paket:

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Verfügbare Exporte

| Export | Funktion |
|--------|-------------|
| `TranslationMethod` | Basisklasse für alle Methoden |
| `LLMMethod` | Basisklasse für LLM-Methoden (OpenRouter) |
| `DirectLLMMethod` | Basisklasse für direkte LLM-Anbieter (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Klassen für direkte LLM-Anbieter |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Traditionelle MT-Klassen (Maschinelle Übersetzung) |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Gecoachtes LLM (OpenRouter + Coaching-Daten) |
| `APIMethod` | Remote-API-Client |
| `runSync`, `runContentSync` | Vollständige Synchronisierungspipeline |
| `resolveConfig`, `resolvePairs` | Konfigurationsauflösung |
| `validateTranslations` | Quality Gate |
| `loadCoachingData`, `findDictionaryMatches` | Coaching-Dienstprogramme |

### Benutzerdefinierte Anbieter-Erweiterung

Erweitern Sie `DirectLLMMethod`, um einen neuen LLM-Anbieter in ca. 40 Zeilen hinzuzufügen:

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

Sie erhalten Übersetzung, Coaching, Wiederholungsschleifen (Retry Loops), Modellvalidierung, Qualitätsstufen und Einrichtungshilfe kostenlos dazu. Nur die Form der HTTP-Anfrage ist anbieterspezifisch. Für Nicht-LLM-Adapter, die reines `fetch()` verwenden, nutzen Sie den freigegebenen `fetchWithRetry()`-Helfer aus `lib/methods/fetch-with-retry.js`, anstatt Ihre eigene Wiederholungsschleife zu schreiben.

---

## Siehe auch

- [CLI-Referenz](/docs/reference/cli) — alle Befehle und Flags
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Methoden auswählen und mischen
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — Manifestformat für Methoden-Plugins
- [Architektur](/docs/concepts/architecture) — wie die Komponenten zusammenhängen
- [Unterstützte Sprachen](/docs/reference/supported-languages) — integrierte Sprachunterstützung
- [Wie die Synchronisierung funktioniert](/docs/concepts/how-sync-works) — die Übersetzungspipeline