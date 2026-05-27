---
sidebar_position: 2
title: "30 Sprachen übersetzen"
description: "Leitfaden: Skalieren Sie ein Projekt von 3 auf 30 Sprachen durch einen Methoden-Mix pro Sprachpaar, Stapelverarbeitung und CI-Integration."
---
# Cookbook: 30 Sprachen übersetzen

Skalieren Sie ein Projekt von einer Handvoll Lokalisierungen zu globaler Abdeckung. Dieses Cookbook führt Sie durch die Methodenauswahl, Kostenoptimierung und CI-Integration für eine reale mehrsprachige Bereitstellung.

**Szenario:** Sie haben eine SaaS-App mit `en`, `fr`, `es`. Sie müssen 27 weitere Sprachen über drei Stufen von Qualitätsanforderungen hinweg hinzufügen.

---

## Schritt 1: Kategorisieren Sie Ihre Sprachen

Nicht alle 30 Sprachen benötigen denselben Ansatz. Gruppieren Sie diese nach der Qualität der verfügbaren Methode:

| Stufe | Sprachen | Methode | Warum |
|------|-----------|--------|-----|
| **Stufe 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Hochwertige Märkte, nuancierte Grammatik |
| **Stufe 2 — Standard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Hohes Volumen, gut von Google unterstützt |
| **Stufe 3 — Coached** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + Plugins | Ressourcenarm, erfordern Durchsetzung von Terminologie |

## Schritt 2: Pro Sprachpaar konfigurieren

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**Hinweis:** Sprachen, die nicht in `pairs` aufgeführt sind, erben `defaultMethod: "google-translate"`. Sie müssen nicht alle 30 auflisten.

:::info
Die Unterstützung für `crk` befindet sich in der Entwicklung — siehe [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) für den Status und Richtlinien zur Mitwirkung.
:::

## Schritt 3: API-Schlüssel einrichten

Sie benötigen beide API-Schlüssel für diese Konfiguration:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Schritt 4: Zuerst ein Testlauf

Führen Sie immer eine Vorschau durch, bevor Sie 30 Sprachen übersetzen:

```bash
npx i18n-rosetta sync --dry
```

Überprüfen Sie die Ausgabe. Sie wird Folgendes anzeigen:
- Welche Paare welche Methode verwenden
- Wie viele Schlüssel pro Lokalisierung neu oder geändert sind
- Geschätzte API-Aufrufe pro Stufe

## Schritt 5: Führen Sie die Synchronisierung aus

```bash
npx i18n-rosetta sync
```

Rosetta verarbeitet jedes Paar unabhängig. Die Paare der Stufe 2, die Google Translate verwenden, werden schnell sein. LLM-Paare der Stufe 1 werden langsamer sein, bieten aber eine höhere Qualität. Die gecoachten Paare der Stufe 3 verwenden die Coaching-Daten des Plugins.

### Inkrementelle Aktualisierungen

Nach der anfänglichen Synchronisierung übersetzen nachfolgende Durchläufe nur **geänderte oder neue** Schlüssel:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

Die Sperrdatei (`.i18n-rosetta.lock`) verfolgt, was übersetzt wurde, sodass Sie stabile Inhalte niemals neu übersetzen.

## Schritt 6: Qualität prüfen

Überprüfen Sie den Status aller Sprachpaare:

```bash
npx i18n-rosetta status
```

Dies gibt eine Tabelle aus, die die Methode, das Modell, die Qualitätsstufe jedes Paares anzeigt und ob Coaching-Daten oder Benchmark-Werte verfügbar sind.

## Schritt 7: CI-Integration

Fügen Sie dies Ihrem GitHub Actions-Workflow hinzu, damit die Übersetzungen bei jedem Push aktuell bleiben:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## Kostenschätzung

Für ein Projekt mit 500 Quellschlüsseln in 30 Sprachen:

| Stufe | Sprachen | Methode | Ungefähre Kosten |
|------|-----------|--------|-----------------|
| Stufe 1 (5 Sprachen) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/vollständige Synchronisierung |
| Stufe 2 (18 Sprachen) | it, nl, pl, etc. | Google Translate | ~$0.90/vollständige Synchronisierung |
| Stufe 3 (4 Sprachen) | crk, oj, mi, haw | GPT-4o-mini coached | ~$0.40/vollständige Synchronisierung |
| **Gesamt** | **30 Sprachen** | **Gemischt** | **~$3.80/vollständige Synchronisierung** |

Inkrementelle Synchronisierungen (5–20 geänderte Schlüssel) kosten nur einen Bruchteil einer vollständigen Synchronisierung.

## Siehe auch

- [Übersetzungsmethoden](/docs/guides/translation-methods) — Wie jede Übersetzungsmethode funktioniert und wann sie verwendet werden sollte
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — Erstellen Sie Coaching-Daten für jede Ihrer Sprachen der Stufe 3
- [CI/CD-Leitfaden](/docs/guides/ci-cd) — Fortgeschrittene CI-Muster einschließlich PR-Vorschau-Builds
- [Quality Gate](/docs/concepts/quality-gate) — Wie Rosetta jede Übersetzung validiert, bevor sie geschrieben wird
- [Unterstützte Sprachen](/docs/reference/supported-languages) — Vollständige Liste der Sprachcodes und Methodenkompatibilität
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) — Fügen Sie Coaching-Daten für Sprachen ohne breite MT-Abdeckung hinzu