# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README-Übersetzungen** — *natürlich von rosetta übersetzt:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Übersetzen Sie Ihre Locale-Dateien mit einem Befehl:

```bash
npx i18n-rosetta sync
```

Rosetta erkennt automatisch Ihre Locale-Dateien, deren Format und die Zielsprachen. Es übersetzt fehlende Schlüssel, überspringt bereits erledigte Aufgaben und schreibt die Ergebnisse. Das ist alles.

## Warum nicht einfach selbst skripten?

Sie könnten ein kurzes Skript schreiben, das Ihre englischen Schlüssel durchläuft und Google Translate aufruft. Die meisten Entwickler tun dies – es sind etwa 30 Zeilen Code. Hier ist, warum es fehlschlägt:

- **Keine Änderungsdetektion.** Wenn Sie eine englische Zeichenkette aktualisieren, bleibt die Übersetzung für immer veraltet. Rosetta verfolgt jeden Quellwert mit SHA-256-Hashes und übersetzt nur das neu, was sich geändert hat.
- **Kein Batching.** Ein API-Aufruf pro Schlüssel bedeutet 200 Schlüssel = 200 Roundtrips. Rosetta führt intelligentes Batching durch (konfigurierbar, Standard 30 Schlüssel/Batch für LLM, 128 für Google).
- **Kein Qualitäts-Gate.** Maschinelle Übersetzungen halluzinieren, geben die Quelle wieder oder geben sie in der falschen Schrift aus. Rosetta validiert jede Übersetzung, bevor sie geschrieben wird – falsche Schrift, Längeninflation und Quellwiederholungen werden erkannt und abgelehnt.
- **Keine Formaterkennung.** Fest auf JSON codiert? Rosetta verarbeitet JSON, TOML, YAML und Hugo Markdown (Frontmatter + Body) mit automatischer Erkennung.
- **Keine Sicherheit.** Rosetta schützt vor Prototypen-Pollution, Pfad-Traversal über manipulierte Locale-Codes und Codeblock-Korruption während der Markdown-Übersetzung.

Rosetta ist die Produktionsversion dieses Skripts.

## Schnellstart

```bash
npm install --save-dev i18n-rosetta
```

### API-Schlüssel besorgen

Rosetta benötigt ein Übersetzungs-Backend. Wählen Sie eines aus:

| Anbieter | Schlüssel | Am besten für |
|----------|-----|----------|
| **OpenRouter** (empfohlen) | `OPENROUTER_API_KEY` | Inhaltsreiche Projekte, Markdown, über 200 Modelle |
| **OpenAI** | `OPENAI_API_KEY` | Direkter GPT-4o-Zugriff |
| **Anthropic** | `ANTHROPIC_API_KEY` | Direkter Claude-Zugriff |
| **Gemini** | `GEMINI_API_KEY` | Kostenlose Stufe verfügbar |
| **DeepL** | `DEEPL_API_KEY` | Europäische Sprachen, Glossar-Unterstützung |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | Über 130 Sprachen, hohes Volumen |

**Schnellster Start** (kostenlos): Melden Sie sich unter [aistudio.google.com](https://aistudio.google.com/apikey) für einen kostenlosen Gemini-Schlüssel an:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (über 200 Modelle): Melden Sie sich unter [openrouter.ai](https://openrouter.ai) an, dann:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** Alternative (nur Schlüssel-Wert-Paare – keine Markdown-Erkennung):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Hinweis**: Wenn nur `GOOGLE_TRANSLATE_API_KEY` gesetzt ist, wechselt Rosetta automatisch zu Google Translate. Keine Konfigurationsänderung erforderlich. Verwendet die REST-API direkt – kein SDK, kein Service-Konto, kein `pip install`. Nur der Schlüssel.

Das ist alles. Für mehr Kontrolle erstellen Sie eine Konfigurationsdatei:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Jede Sprache kommt mit **Register-Presets** – vorgefertigten Anweisungen zu Ton und Formalität, die auf ihr linguistisches System abgestimmt sind (Vouvoiement für Französisch, Siezen für Deutsch, です/ます für Japanisch, 해요체 für Koreanisch). Der Initialisierungsassistent ermöglicht es Ihnen, Presets zu durchsuchen und auszuwählen, oder `--yes` zu übergeben, um die Standardwerte zu akzeptieren.

### Nicht-englische Quelle

Wenn Ihre Ausgangssprache nicht Englisch ist:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

Oder legen Sie es dauerhaft in Ihrer Konfiguration fest:

```json
{ "inputLocale": "fr" }
```

## Was es tut

Sie kümmern sich um das i18n-Framework (next-intl, i18next, Hugo). Rosetta kümmert sich um die Übersetzungsdateien.

- **Multi-Format** — JSON, TOML, YAML, Hugo Markdown (Front Matter + Body) und XLIFF 1.2
- **Inkrementell** — Übersetzt nur das, was sich geändert hat (SHA-256 Hash-Tracking)
- **Gecached** — Translation Memory speichert frühere Ergebnisse; das erneute Ausführen der Synchronisierung kostet für unveränderte Schlüssel nichts
- **Qualitätsgesichert** — Validiert jede Übersetzung: erkennt Halluzinationen, Ausgaben in falscher Schrift, Quellwiederholungen und Längeninflation
- **Inhaltsbewusst** — LLM-Methoden schützen Codeblöcke, Shortcodes, Links und Interpolationsvariablen während der Markdown-Übersetzung
- **Pipeline-Tools** — `lint`, `audit`, `integrity`, `seo` für CI-Gates
- **XLIFF-Interoperabilität** — Exportiert Übersetzungen zur professionellen Überprüfung in CAT-Tools (memoQ, SDL Trados, Phrase), importiert sie zurück
- **Keine Abhängigkeiten** — Nur Node.js-Built-ins. Keine SDKs, keine nativen Module. Erfordert Node 20+

## Jenseits von Google Translate

Der Schnellstart bringt Sie mit einem LLM oder Google Translate zum Laufen. Aber Google Translate unterstützt ~130 Sprachen. Es gibt über 7.000.

**Rosettas Kernidee: Die Übersetzungsmethode ist pro Sprachpaar konfigurierbar.** Verwenden Sie Google Translate für Französisch, ein LLM mit morphologischem Coaching für Plains Cree und eine von der Community gehostete API für Quechua – alles im selben Projekt, alles mit derselben CLI.

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

Wenn Sie herausfinden können, wie ein Sprachpaar übersetzt wird – durch Prompt Engineering, Community-Wörterbücher, FST-Pipelines oder fein abgestimmte Modelle – können Sie mit Rosetta diese Methode als Plugin verpacken und neben allem anderen bereitstellen.

> Entstanden aus der Übersetzung einer Produktionswebsite ins Plains Cree, wo keine fertige API existiert. Die Pro-Paar-Architektur ist nicht theoretisch – sie existiert, weil ein Projekt Google Translate für Französisch und eine gecoachte FST-Pipeline für eine indigene Sprache benötigte, die nebeneinander im selben Synchronisierungsbefehl liefen.

Das begleitende [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) ermöglicht Ihnen, Übersetzungsansätze zu benchmarken und zu vergleichen und anschließend funktionierende Methoden als Rosetta-Plugins zu exportieren. Jeder, der beide Sprachen spricht, kann eine Übersetzungsmethode entwickeln, testen und teilen – keine proprietäre Plattform erforderlich.

### Wählen Sie Ihre Methode

Rosetta unterstützt 10 Übersetzungsmethoden. Jedes Sprachpaar kann eine andere Methode verwenden.

**LLM-Anbieter** — am besten für Qualität, Markdown-fähig, Coaching-kompatibel:

| Methode | Schlüssel | Was es tut |
|--------|-----|-------------|
| `llm` (Standard) | `OPENROUTER_API_KEY` | LLM über OpenRouter – über 200 Modelle, automatische Weiterleitung |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + Grammatikregeln, Wörterbücher, Stilhinweise |
| `openai` | `OPENAI_API_KEY` | Direkte OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Direkte Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Direkte Google Gemini API (Flash, Pro) – kostenlose Stufe verfügbar |

**Traditionelle MT** — am besten für Geschwindigkeit, Kosten und große Mengen von Schlüssel-Wert-Paaren:

| Methode | Schlüssel | Was es tut |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (über 130 Sprachen) |
| `deepl` | `DEEPL_API_KEY` | DeepL API mit Glossar-Unterstützung (über 30 Sprachen) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (über 100 Sprachen) |
| `libretranslate` | *(selbst gehostet)* | Selbst gehostetes LibreTranslate (AGPL, kostenlos) |

**Infrastruktur** — für benutzerdefinierte oder von der Community gehostete Endpunkte:

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

> **Hinweis**: Traditionelle MT-Methoden (Google Translate, DeepL, Microsoft Translator, LibreTranslate) verarbeiten Schlüssel-Wert-Paare gut, können aber Markdown-Inhalte nicht sicher übersetzen. Für inhaltsreiche Projekte werden LLM-Methoden empfohlen – sie schützen Codeblöcke, Shortcodes und Interpolationsvariablen explizit.

## Plugins

Plugins sind vorgefertigte Übersetzungsrezepte für bestimmte Sprachpaare. Es handelt sich um JSON-Manifeste – keine Codes – die Rosetta mitteilen, welche Methode mit welchen Einstellungen verwendet werden soll und welche Qualität benchmarkt wurde.

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
| `init` | Interaktiver Einrichtungsassistent (oder `--yes` für schnelle Standardeinstellungen) |
| `sync` | Alle Locale-Dateien übersetzen & synchronisieren |
| `watch` | Automatische Synchronisierung bei Dateiänderungen |
| `audit` | Unvollständige Locales kennzeichnen (CI-Gate) |
| `lint` | Hartcodierte Zeichenketten im Quellcode finden |
| `wrap` | Hartcodierte Zeichenketten automatisch in `t()`-Aufrufe umwandeln (mit Rückgängig) |
| `seo` | hreflang, sitemap.xml oder JSON-LD-Schema generieren |
| `integrity` | Auf Platzhalterkorruption, Kodierung und ICU-Pluralvollständigkeit prüfen |
| `status` | Paarkonfiguration, Methoden, Register und Qualitätsstufen anzeigen |
| `provenance` | Lizenzierung von Übersetzungsressourcen prüfen |
| `plugin` | Methoden-Plugins installieren, entfernen oder auflisten |
| `fonts` | Webfonts für PUA-Skriptkonverter herunterladen |
| `tm` | Translation Memory Cache verwalten (Statistiken, leeren, pro Locale) |
| `xliff` | XLIFF 1.2 für professionelle Übersetzerprüfung exportieren/importieren |

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
| `contentDir` | `null` | Hugo-Inhaltsverzeichnis (ermöglicht Markdown-Übersetzung) |
| `format` | `"auto"` | Dateiformat: `json`, `toml`, `yaml` oder `auto` |
| `model` | `"google/gemini-3.5-flash"` | Standard-OpenRouter-Modell |
| `defaultMethod` | `"llm"` | Standard-Übersetzungsmethode (wird durch `--method`-Flag überschrieben) |
| `batchSize` | `30` | Schlüssel pro Übersetzungs-Batch |
| `pairs` | `{}` | Pro-Paar-Methode, Modell und Qualitätsüberschreibungen |

**Sprachspezifische Überschreibungen**: Jede Sprache hat eine [Sprachkarte](docs/planning/LANGUAGE_CARD_SPEC.md) – eine von 50 kuratierten Karten, die Register-Presets, Formalitätssysteme, Typografie-Regeln und Methodensupport-Flags enthalten. Karten verwenden eine [zweistufige Architektur](website/docs/concepts/architecture.md) (Laufzeit + Referenz) für Leistung im großen Maßstab. Erstellen Sie eine neue Karte mit `node scripts/generate-language-card.mjs <code>`. Verwenden Sie Preset-Schlüssel als Kurzform oder schreiben Sie benutzerdefinierten Registertext:

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

Sprachwerte können ein Preset-Schlüssel sein (z.B. `"casual-tu"`), benutzerdefinierter Registertext oder ein Objekt (volle Kontrolle). Paar-Level-Überschreibungen in `pairs` haben Vorrang vor sprach-level-Einstellungen. Führen Sie `npx i18n-rosetta init` aus, um die verfügbaren Presets für jede Sprache zu durchsuchen.

Framework-Einrichtungsanleitungen: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Härtung

- **Exponentieller Backoff** — 3 Wiederholungsversuche mit Jitter bei 429/5xx-Fehlern
- **30s Request Timeout** — AbortController verhindert Hängenbleiben
- **Antwortvalidierung** — akzeptiert nur Schlüssel, die zur Übersetzung gesendet wurden
- **Qualitäts-Gate** — fängt Halluzinationsschleifen, Ausgaben in falscher Schrift, Längeninflation und Quellwiederholungen ab
- **Wiederholungskaskade** — bei JSON-Parse-Fehlern wird der Batch → halbe Batch → einzelne Schlüssel wiederholt (budgetbegrenzt über `maxRetries`)
- **Translation Memory** — `.rosetta/tm.json` speichert Übersetzungen, die nach Quelltext + Locale + Methode verschlüsselt sind; unveränderte Schlüssel werden bei nachfolgenden Synchronisierungen aus dem Cache bereitgestellt, wodurch redundante API-Aufrufe entfallen
- **Prompt-Caching** — die Aufteilung von System-/Benutzernachrichten ermöglicht anbieterseitiges Caching, wodurch die Token-Kosten über Batches hinweg reduziert werden
- **Terminologie-Durchsetzung** — gecoachte Übersetzungen werden nach der LLM-Antwort anhand von Wörterbuchbegriffen überprüft
- **Prototype Pollution Guard** — blockiert `__proto__`, `constructor`, `prototype`
- **Pfadbegrenzung** — Dateischreibvorgänge werden validiert, um innerhalb der konfigurierten Verzeichnisse zu bleiben
- **Blockschutz** — Codeblöcke, Shortcodes, HTML werden während der Inhaltsübersetzung geschützt
- **Expliziter Fallback** — `--fallback` schreibt `[EN]`-präfixierte Platzhalter, wenn die API nicht verfügbar ist (erneute Synchronisierung mit einem Schlüssel für echte Übersetzungen)
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