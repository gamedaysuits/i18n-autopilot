---
sidebar_position: 7
title: "Für Unternehmen"
description: "Wie Organisationen Übersetzungen mit in Leaderboards bewährten Methoden, benutzerdefinierten Plugins und Deployment mit nur einem Befehl standardisieren können."
---
# i18n-rosetta für Unternehmen

Ihr Team übersetzt regelmäßig Inhalte. Sie verfügen über einen Stapel von Lokalisierungsdateien, eine CI-Pipeline und einen Prozess, bei dem wahrscheinlich jemand manuell Google Translate ausführt, die Ergebnisse in JSON kopiert und auf das Beste hofft. Oder Sie bezahlen für eine TMS-Plattform, bei der Sie an die Übersetzungs-Engine eines einzigen Anbieters gebunden sind.

Es gibt einen besseren Weg.

## Das Konzept

1. **Wählen Sie die beste Methode für jede Sprache** – nicht das, was Ihr Anbieter standardmäßig vorgibt
2. **Bereitstellung mit einem Befehl** – `npx i18n-rosetta sync` übersetzt jede Lokalisierung, jedes Format, jedes Mal
3. **Wechseln Sie Methoden ohne Code-Änderungen** – eine Konfigurationsänderung, keine Migration
4. **Behalten Sie die Kontrolle über Ihre Pipeline** – keine Anbieterbindung, keine monatlichen Dashboards, keine Konten

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

Französisch erhält DeepL (Ihr Team bevorzugt dessen europäische Sprachgewandtheit). Japanisch erhält ein Frontier-LLM. Deutsch erhält Google Translate (schnell, günstig, ausreichend). Koreanisch erhält ein LLM mit formellem Sprachregister. Plains Cree erhält ein von der Community entwickeltes, trainiertes Plugin, das auf der Rangliste die höchste Punktzahl erreicht hat.

**Derselbe Befehl. Dieselbe CI-Pipeline. Unterschiedliche Methoden pro Sprachpaar. Eine Konfigurationsdatei.**

## Der Workflow: Von der Rangliste zur Bereitstellung

:::tip Bald verfügbar: `rosetta leaderboard` CLI
Der unten beschriebene Workflow ist die geplante Integration zwischen der [MT Eval Arena](https://mtevalarena.org)-Rangliste und der i18n-rosetta-CLI. Die Infrastruktur existiert auf beiden Seiten – die Verbindung befindet sich in der Entwicklung.
:::

In der [MT Eval Arena](https://mtevalarena.org) werden Übersetzungsmethoden mit reproduzierbaren, eindeutig identifizierbaren Bewertungen verglichen. Jede Methode erhält eine Gesamtpunktzahl über mehrere Metriken hinweg (chrF++, exakte Übereinstimmung, FST-Akzeptanz, semantische Bewertung). Die Rangliste erfasst jede Einreichung.

Der geplante Workflow:

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**Sie entwickeln die Methode nicht. Sie trainieren das Modell nicht. Sie wählen den Gewinner aus und stellen ihn bereit.** Wenn im nächsten Monat eine bessere Methode auf der Rangliste erscheint, tauschen Sie diese mit einem einzigen Befehl aus.

## Was heute verfügbar ist

Die Verbindung zwischen Rangliste und CLI befindet sich in der Entwicklung. Folgendes funktioniert bereits jetzt:

### Integrierte Methoden (keine Plugins erforderlich)

| Methode | Am besten geeignet für | Kosten |
|--------|----------|------|
| `llm` (Standard) | Qualitätsfokussiert, jede Sprache | Pro Token über OpenRouter |
| `gemini` | Qualität + kostenlose Stufe | Kostenlos (begrenzt), danach pro Token |
| `google-translate` | Geschwindigkeit + Volumen | 20 $/Mio. Zeichen |
| `deepl` | Europäische Sprachen | 25 $/Mio. Zeichen |
| `llm-coached` | Sprachen mit Trainingsdaten | Pro Token über OpenRouter |
| `api` | Benutzerdefinierte/Community-gehostete Methoden | Selbstgehostet |

### Plugin-Methoden (separat installieren)

Benutzerdefinierte Plugins können jede beliebige Übersetzungslogik umfassen – ein feinabgestimmtes Modell, eine FST-gesteuerte Pipeline, eine Community-API oder alles andere, was JSON erzeugt. Siehe [Ein Plugin erstellen](/docs/tutorials/build-a-plugin).

## Unternehmens-Workflow

### 1. Bewerten Sie Ihre aktuelle Qualität

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Führen Sie die Evaluierungsumgebung für Kandidaten aus

Die [Evaluierungsumgebung](https://mtevalarena.org/docs/specifications/harness) ermöglicht es Ihnen, mehrere Methoden anhand desselben Datensatzes zu vergleichen. Führen Sie einen Durchlauf aus, vergleichen Sie die Ergebnisse und wählen Sie die Gewinner:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Konfigurieren Sie die Gewinner pro Sprachpaar

Aktualisieren Sie Ihre Konfiguration, um die beste Methode pro Sprachpaar zu verwenden. Unterschiedliche Sprachen haben unterschiedliche beste Methoden – genau darum geht es.

### 4. Integration in CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Drei Befehle. Keine manuelle Übersetzung. Die Pipeline erfasst fest codierte Zeichenfolgen, übersetzt sie mit Ihren gewählten Methoden und lässt den Build fehlschlagen, falls etwas fehlt oder beschädigt ist.

### 5. Professionelle Überprüfung (optional)

Für geschäftskritische Inhalte exportieren Sie nach XLIFF für eine menschliche Überprüfung:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Übersetzen Sie den Großteil maschinell. Lassen Sie die kritischen Pfade von Menschen überprüfen. Bezahlen Sie für menschliche Arbeitszeit nur dort, wo es darauf ankommt.

## Kostenmodell

rosetta hat **keine Lizenzgebühren, kein monatliches Abonnement, keine nutzerbasierten Preise**. Es ist ein Open-Source-CLI-Tool. Sie zahlen nur für die Übersetzungs-API-Aufrufe:

| Volumen | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1.000 Schlüssel × 5 Lokalisierungen | ~0,50 $ | ~0,30 $ (kostenlose Stufe) | ~2,00 $ |
| 10.000 Schlüssel × 15 Lokalisierungen | ~15 $ | ~8 $ | ~60 $ |
| 50.000 Schlüssel × 30 Lokalisierungen | ~75 $ | ~40 $ | ~300 $ |

Translation Memory bedeutet, dass Sie bei nachfolgenden Synchronisierungen nur für **geänderte Schlüssel** bezahlen. Wenn Sie 10 von 10.000 Zeichenfolgen aktualisieren, bezahlen Sie für 10 Übersetzungen, nicht für 10.000.

## im Vergleich zu TMS-Plattformen

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Preisgestaltung** | Kostenlos (Open Source) + API-Kosten | 50–500 $/Monat + nutzerbasiert |
| **Anbieterbindung** | Keine – Anbieterwechsel in der Konfiguration | Hoch – Daten in deren Cloud |
| **Methodenauswahl** | Jeder Anbieter, jedes Modell, pro Sprachpaar | Was auch immer sie anbieten |
| **CI/CD** | Erstklassig (`lint → sync → audit`) | Plugin/Webhook |
| **Benutzerdefinierte Methoden** | Plugin-System, Community-Plugins | Nicht unterstützt |
| **Qualitätskontrolle** | Integriert (falsches Skript, Echo, Länge) | Variiert |
| **Selbstgehostet** | Ja (LibreTranslate, benutzerdefinierte API) | Nein |

Weitere Details finden Sie im [vollständigen Vergleich](/docs/guides/comparison).

## Weiterführende Literatur

- **[Schnellstart](/docs/getting-started/quick-start)** – Führen Sie Ihre erste Synchronisierung in 60 Sekunden aus
- **[Übersetzungsmethoden](/docs/guides/translation-methods)** – das vollständige Methodenmenü mit Entscheidungsbaum
- **[CI/CD-Integration](/docs/guides/ci-cd)** – Automatisierung in Ihrer Pipeline
- **[Zusammenarbeit mit professionellen Übersetzern](/docs/guides/professional-translators)** – XLIFF-Export/Import
- **[MT Eval Arena](https://mtevalarena.org)** – Benchmark und Rangliste
- **[Konfigurationsreferenz](/docs/getting-started/configuration)** – jede Konfigurationsoption