---
sidebar_position: 2
title: Quick Start
---

# Quick Start

Translate your first locale file in 60 seconds.

## 1. Set Up Your Locale Files

Create a source locale file. Rosetta supports JSON, TOML, and YAML:

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

## 2. Set Your API Key

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

## 3. Run Sync

```bash
npx i18n-rosetta sync
```

Rosetta will:
1. Auto-detect `locales/en.json` as the source
2. Find (or prompt for) target languages
3. Translate all keys
4. Write `locales/fr.json`, `locales/ja.json`, etc.
5. Create `.i18n-rosetta.lock` to track what's been translated

## 4. Check the Results

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

## What Happens Next?

When you change a source string, rosetta detects the change via SHA-256 hash tracking and re-translates only that key on the next sync:

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

## Optional: Create a Config File

For more control, generate a config file:

```bash
npx i18n-rosetta init
```

Or create one manually:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "openai/gpt-4o-mini"
}
```

## Optional: Watch Mode

Auto-translate when your source file changes:

```bash
npx i18n-rosetta watch
```

## Next Steps

- **[Configuration](/docs/getting-started/configuration)** — Full config reference
- **[Translation Methods](/docs/guides/translation-methods)** — Choose the right method
- **[Framework Integration](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Automate translations in your pipeline
