---
sidebar_position: 2
title: "Schnellstart"
---
# Schnellstart

Übersetzen Sie Ihre erste Lokalisierungsdatei in 60 Sekunden.

## 1. Richten Sie Ihre Lokalisierungsdateien ein

Erstellen Sie eine Quell-Lokalisierungsdatei. Rosetta unterstützt JSON, TOML und YAML:

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. Legen Sie Ihren API-Schlüssel fest

Wählen Sie einen Anbieter und legen Sie den Schlüssel fest:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Holen Sie sich einen kostenlosen Gemini-Schlüssel unter [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Holen Sie sich einen OpenRouter-Schlüssel unter [openrouter.ai](https://openrouter.ai).

## 3. Führen Sie die Synchronisierung aus

```bash
npx i18n-rosetta sync
```

:::tip Verwenden Sie Gemini?
Wenn Sie Option B (Gemini) gewählt haben, fügen Sie `--method gemini` hinzu:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta wird:
1. `locales/en.json` automatisch als Quelle erkennen
2. Zielsprachen ermitteln (oder abfragen)
3. Alle Schlüssel übersetzen
4. `locales/fr.json`, `locales/ja.json` usw. schreiben
5. `.i18n-rosetta.lock` erstellen, um zu verfolgen, was übersetzt wurde

## 4. Überprüfen Sie die Ergebnisse

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## Was passiert als Nächstes?

Wenn Sie eine Quellzeichenfolge ändern, erkennt rosetta die Änderung über die SHA-256-Hash-Verfolgung und übersetzt bei der nächsten Synchronisierung nur diesen Schlüssel neu:

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

Der unveränderte Schlüssel (`hero.subtitle`) wird aus dem **Translation Memory**-Zwischenspeicher von rosetta bereitgestellt — kein API-Aufruf, keine Kosten. Der Zwischenspeicher wird bei jeder Synchronisierung automatisch aufgebaut und unter `.rosetta/tm.json` gespeichert.

## Optional: Erstellen Sie eine Konfigurationsdatei

Für mehr Kontrolle generieren Sie eine Konfigurationsdatei:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

Der geführte Assistent leitet Sie durch die **Register-Voreinstellungen** jeder Sprache — vorgefertigte Anweisungen zu Tonfall und Formalität, die auf das jeweilige linguistische System abgestimmt sind. Französisch verfügt über T-V-Voreinstellungen (vouvoiement vs. tutoiement), Koreanisch über Sprachebenen (해요체 vs. 합쇼체 vs. 해체), Japanisch über Keigo-Optionen (です/ます vs. 丁寧語).

Oder erstellen Sie manuell eine Konfiguration mit voreingestellten Schlüsseln:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

Führen Sie `npx i18n-rosetta init` aus, um die verfügbaren Voreinstellungen für jede Sprache zu durchsuchen.

## Optional: Überwachungsmodus

Übersetzen Sie automatisch, wenn sich Ihre Quelldatei ändert:

```bash
npx i18n-rosetta watch
```

## Nächste Schritte

- **[Konfiguration](/docs/getting-started/configuration)** — Vollständige Konfigurationsreferenz
- **[Übersetzungsmethoden](/docs/guides/translation-methods)** — Wählen Sie die richtige Methode pro Sprachpaar
- **[Translation Memory](/docs/concepts/translation-memory)** — Wie das Zwischenspeichern Ihnen bei erneuten Ausführungen Geld spart
- **[Zusammenarbeit mit professionellen Übersetzern](/docs/guides/professional-translators)** — Exportieren Sie XLIFF für die menschliche Überprüfung
- **[Framework-Integration](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Automatisieren Sie Übersetzungen in Ihrer Pipeline
- **[Fehlerbehebung](/docs/guides/troubleshooting)** — Häufige Probleme und Lösungen