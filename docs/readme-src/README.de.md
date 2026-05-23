# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README-Übersetzungen** — *natürlich von rosetta übersetzt:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Übersetzen Sie Ihre Locale-Dateien mit einem einzigen Befehl:

```bash
npx i18n-rosetta sync
```

Rosetta erkennt automatisch Ihre Locale-Dateien, deren Format und die Zielsprachen. Es übersetzt fehlende Schlüssel, überspringt bereits erledigte und schreibt die Ergebnisse. Das ist alles.

## Warum nicht einfach selbst ein Skript schreiben?

Sie könnten ein schnelles Skript schreiben, das Ihre englischen Schlüssel durchläuft und Google Translate aufruft. Die meisten Entwickler tun dies – es sind etwa 30 Zeilen Code. Hier ist, warum es fehlschlägt:

- **Keine Änderungsdetektion.** Wenn Sie einen englischen String aktualisieren, bleibt die Übersetzung für immer veraltet. Rosetta verfolgt jeden Quellwert mit SHA-256-Hashes und übersetzt nur das neu, was sich geändert hat.
- **Kein Batching.** Ein API-Aufruf pro Schlüssel bedeutet 200 Schlüssel = 200 Roundtrips. Rosetta führt intelligentes Batching durch (konfigurierbar, Standard 30 Schlüssel/Batch für LLM, 128 für Google).
- **Keine Qualitätskontrolle.** Maschinelle Übersetzungen halluzinieren, geben die Quelle zurück oder liefern Ausgaben in der falschen Schrift. Rosetta validiert jede Übersetzung, bevor sie geschrieben wird – falsche Schrift, Längeninflation und Quell-Echos werden erkannt und abgelehnt.
- **Kein Formatbewusstsein.** Fest auf JSON codiert? Rosetta verarbeitet JSON, TOML, YAML und Hugo Markdown (Frontmatter + Body) mit automatischer Erkennung.
- **Keine Sicherheit.** Rosetta schützt vor Prototype Pollution, Path Traversal über manipulierte Locale-Codes und Codeblock-Korruption während der Markdown-Übersetzung.

Rosetta ist die Produktionsversion dieses Skripts.

## Schnellstart

```bash
npm install --save-dev i18n-rosetta
```

### API-Schlüssel abrufen

Rosetta benötigt ein Übersetzungs-Backend. Wählen Sie eines aus:

| Anbieter | Schlüssel | Am besten geeignet für |
|----------|-----|----------|
| **OpenRouter** (empfohlen) | `OPENROUTER_API_KEY` | Inhaltsreiche Projekte, Markdown, 200+ Modelle |
| **OpenAI** | `OPENAI_API_KEY` | Direkter GPT-4o-Zugriff |
| **Anthropic** | `ANTHROPIC_API_KEY` | Direkter Claude-Zugriff |
| **Gemini** | `GEMINI_API_KEY` | Kostenlose Stufe verfügbar |
| **DeepL** | `DEEPL_API_KEY` | Europäische Sprachen, Glossar-Unterstützung |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130+ Sprachen, hohes Volumen |

**Schnellster Start** (kostenlos): Melden Sie sich unter [aistudio.google.com](https://aistudio.google.com/apikey) für einen kostenlosen Gemini-Schlüssel an:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200+ Modelle): Melden Sie sich unter [openrouter.ai](https://openrouter.ai) an, dann:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** Alternative (nur Schlüssel-Wert-Paare – kein Markdown-Bewusstsein):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Hinweis**: Wenn nur `GOOGLE_TRANSLATE_API_KEY` gesetzt ist, wechselt rosetta automatisch zu Google Translate. Keine Konfigurationsänderung erforderlich. Verwendet die REST-API direkt – kein SDK, kein Dienstkonto, kein `pip install`. Nur der Schlüssel.

Das war's. Für mehr Kontrolle erstellen Sie eine Konfigurationsdatei:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Jede Sprache wird mit **Register-Presets** geliefert – vorgefertigte Anweisungen für Ton/Formalität, die auf ihr linguistisches System abgestimmt sind (Vouvoiement für Französisch, Siezen für Deutsch, です/ます für Japanisch, 해요체 für Koreanisch). Der Initialisierungsassistent ermöglicht es Ihnen, Presets zu durchsuchen und auszuwählen, oder `--yes` zu übergeben, um die Standardwerte zu akzeptieren.

### Nicht-englische Quelle

Wenn Ihre Quellsprache nicht Englisch ist:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

Oder legen Sie es dauerhaft in Ihrer Konfiguration fest:

```json
{ "inputLocale": "fr" }
```

## Was es tut

Sie kümmern sich um das i18n-Framework (next-intl, i18next, Hugo). Rosetta kümmert sich um die Übersetzungsdateien.

- **Multi-Format** — JSON, TOML, YAML und Hugo Markdown (Front Matter + Body)
- **Inkrementell** — Übersetzt nur das, was sich geändert hat (SHA-256-Hash-Tracking)
- **Qualitätsgesichert** — Validiert jede Übersetzung: fängt Halluzinationen, falsche Skriptausgaben, Quell-Echos und Längeninflation ab
- **Inhaltsbewusst** — LLM-Methoden schützen Codeblöcke, Shortcodes, Links und Interpolationsvariablen während der Markdown-Übersetzung
- **Pipeline-Tools** — `lint`, `audit`, `integrity`, `seo` für CI-Gates
- **Keine Abhängigkeiten** — Nur Node.js-Built-ins. Keine SDKs, keine nativen Module. Erfordert Node 20+

## Jenseits von Google Translate

Der Schnellstart bringt Sie mit einem LLM oder Google Translate zum Laufen. Aber Google Translate unterstützt ~130 Sprachen. Es gibt über 7.000.

**Rosettas Kernidee: Die Übersetzungsmethode ist pro Sprachpaar konfigurierbar.** Verwenden Sie Google Translate für Französisch, ein LLM mit morphologischem Coaching für Plains Cree und eine von der Community gehostete API für Quechua – alles im selben Projekt, alles mit demselben CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Wenn Sie herausfinden können, wie ein Sprachpaar übersetzt werden kann – durch Prompt Engineering, Community-Wörterbücher, FST-Pipelines oder fein abgestimmte Modelle – können Sie diese Methode mit rosetta als Plugin verpacken und neben allem anderen bereitstellen.

> Entstanden aus der Übersetzung einer Produktionswebsite ins Plains Cree, wo es keine fertige API gibt. Die Pro-Paar-Architektur ist nicht theoretisch – sie existiert, weil ein Projekt Google Translate für Französisch und eine gecoachte FST-Pipeline für eine indigene Sprache benötigte, die Seite an Seite im selben Synchronisierungsbefehl liefen.

Das begleitende [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) ermöglicht es Ihnen, Übersetzungsansätze zu benchmarken und zu vergleichen und dann funktionierende Methoden als rosetta-Plugins zu exportieren. Jeder, der beide Sprachen spricht, kann eine Übersetzungsmethode entwickeln, testen und teilen – keine proprietäre Plattform erforderlich.

### Wählen Sie Ihre Methode

Rosetta unterstützt 10 Übersetzungsmethoden. Jedes Sprachpaar kann eine andere Methode verwenden.

**LLM-Anbieter** – am besten für Qualität, Markdown-fähig, Coaching-kompatibel:

| Methode | Schlüssel | Was es tut |
|--------|-----|-------------|
| `llm` (Standard) | `OPENROUTER_API_KEY` | LLM über OpenRouter – 200+ Modelle, automatisches Routing |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + Grammatikregeln, Wörterbücher, Stilhinweise |
| `openai` | `OPENAI_API_KEY` | Direkte OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Direkte Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Direkte Google Gemini API (Flash, Pro) – kostenlose Stufe verfügbar |

**Traditionelle MT** – am besten für Geschwindigkeit, Kosten und große Mengen von Schlüssel-Wert-Paaren:

| Methode | Schlüssel | Was es tut |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ Sprachen) |
| `deepl` | `DEEPL_API_KEY` | DeepL API mit Glossar-Unterstützung (30+ Sprachen) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ Sprachen) |
| `libretranslate` | *(selbst gehostet)* | Selbst gehostetes LibreTranslate (AGPL, kostenlos) |

**Infrastruktur** – für benutzerdefinierte oder von der Community gehostete Endpunkte:

| Methode | Schlüssel | Was es tut |
|--------|-----|-------------|
| `api` | *(pro Anbieter)* | Dünner HTTP-Client für jeden REST-Endpunkt |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **Hinweis**: Traditionelle MT-Methoden (Google Translate, DeepL, Microsoft Translator, LibreTranslate) verarbeiten Schlüssel-Wert-Paare gut, können aber Markdown-Inhalte nicht sicher übersetzen. Für inhaltsreiche Projekte werden LLM-Methoden empfohlen – sie schützen explizit Codeblöcke, Shortcodes und Interpolationsvariablen.

## Plugins

Plugins sind vorgefertigte Übersetzungsrezepte für bestimmte Sprachpaare. Es handelt sich um JSON-Manifeste – keine Codes – die rosetta mitteilen, welche Methode mit welchen Einstellungen verwendet werden soll und welche Qualität benchmarkt wurde.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Siehe [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) für das Manifestformat.

## Befehle

| Befehl | Zweck |
|---------|---------|
| `init` | Interaktiver Einrichtungsassistent (oder `--yes` für schnelle Standardwerte) |
| `sync` | Alle Locale-Dateien übersetzen & synchronisieren |
| `watch` | Automatische Synchronisierung bei Dateiänderungen |
| `audit` | Unvollständige Locales kennzeichnen (CI-Gate) |
| `lint` | Hardcodierte Strings im Quellcode finden |
| `wrap` | Hardcodierte Strings automatisch in `t()`-Aufrufe umwandeln (mit Rückgängig) |
| `seo` | Hreflang, sitemap.xml oder JSON-LD-Schema generieren |
| `integrity` | Auf Platzhalterkorruption und Kodierungsprobleme prüfen |
| `status` | Paar-Konfiguration, Methoden, Register und Qualitätsstufen anzeigen |
| `provenance` | Lizenzierung von Übersetzungsressourcen prüfen |
| `plugin` | Methoden-Plugins installieren, entfernen oder auflisten |

Führen Sie `i18n-rosetta <command> --help` aus, um detaillierte Hilfe zu jedem Befehl zu erhalten.

Vollständige Referenz: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Konfiguration

Erstellen Sie `i18n-rosetta.config.json` oder führen Sie `i18n-rosetta init` aus:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| Option | Standard | Beschreibung |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Quellsprachencode |
| `localesDir` | `"./locales"` | Pfad zu den Locale-Dateien |
| `contentDir` | `null` | Hugo-Inhaltsverzeichnis (aktiviert Markdown-Übersetzung) |
| `format` | `"auto"` | Dateiformat: `json`, `toml`, `yaml` oder `auto` |
| `model` | `"google/gemini-3.5-flash"` | Standard-OpenRouter-Modell |
| `defaultMethod` | `"llm"` | Standard-Übersetzungsmethode (wird durch `--method`-Flag überschrieben) |
| `batchSize` | `30` | Schlüssel pro Übersetzungs-Batch |
| `pairs` | `{}` | Pro-Paar-Methode, Modell und Qualitätsüberschreibungen |

**Sprachspezifische Überschreibungen**: Jede Sprache hat eine [Sprachkarte](docs/planning/LANGUAGE_CARD_SPEC.md) mit voreingestellten Registern, die auf ihr Formalitätssystem abgestimmt sind. Verwenden Sie voreingestellte Schlüssel als Kurzform oder schreiben Sie benutzerdefinierten Registertext:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
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

**Zero-Config-Modus**: Keine Konfigurationsdatei? Rosetta erkennt automatisch Locale-Dateien, Format und Zielsprachen aus Ihrem Projekt.

Sprachwerte können ein voreingestellter Schlüssel sein (z.B. `"casual-tu"`), benutzerdefinierter Registertext oder ein Objekt (volle Kontrolle). Paar-Level-Überschreibungen in `pairs` haben Vorrang vor Sprach-Level-Einstellungen. Führen Sie `npx i18n-rosetta init` aus, um die verfügbaren Presets für jede Sprache zu durchsuchen.

Framework-Setup-Anleitungen: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Härtung

- **Exponentieller Backoff** — 3 Wiederholungsversuche mit Jitter bei 429/5xx-Fehlern
- **30s Request Timeout** — AbortController verhindert Hängenbleiben
- **Antwortvalidierung** — akzeptiert nur Schlüssel, die zur Übersetzung gesendet wurden
- **Qualitätskontrolle** — fängt Halluzinationsschleifen, falsche Skriptausgaben, Längeninflation und Quell-Echos ab
- **Wiederholungskaskade** — bei JSON-Parse-Fehler, Wiederholungsversuche Batch → halber Batch → einzelne Schlüssel (Budget-begrenzt über `maxRetries`)
- **Prompt-Caching** — System-/Benutzernachrichten-Trennung ermöglicht Caching auf Anbieterebene, reduziert Token-Kosten über Batches hinweg
- **Prototype Pollution Guard** — blockiert `__proto__`, `constructor`, `prototype`
- **Pfadbegrenzung** — Dateischreibvorgänge werden validiert, um innerhalb der konfigurierten Verzeichnisse zu bleiben
- **Blockschutz** — Codeblöcke, Shortcodes, HTML werden während der Inhaltsübersetzung geschützt
- **Expliziter Fallback** — `--fallback` schreibt mit `[EN]` präfixierte Platzhalter, wenn die API nicht verfügbar ist (erneute Synchronisierung mit einem Schlüssel für echte Übersetzungen)
- **Teilerfolg** — ein fehlgeschlagener Batch blockiert den Rest nicht

## Testen

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**Keine Abhängigkeiten.**

## Lizenz

MIT