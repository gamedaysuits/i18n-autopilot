---
sidebar_position: 2
title: "Snelstart"
---
# Snelstart

Vertaal uw eerste locale-bestand in 60 seconden.

## 1. Stel uw locale-bestanden in

Maak een bron locale-bestand aan. Rosetta ondersteunt JSON, TOML en YAML:

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

## 2. Stel uw API-sleutel in

Kies een provider en stel de sleutel in:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Vraag een gratis Gemini-sleutel aan op [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Vraag een OpenRouter-sleutel aan op [openrouter.ai](https://openrouter.ai).

## 3. Voer Sync uit

```bash
npx i18n-rosetta sync
```

:::tip Gebruikt u Gemini?
Als u Optie B (Gemini) heeft gekozen, voeg dan `--method gemini` toe:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta zal:
1. `locales/en.json` automatisch detecteren als de bron
2. Doeltalen vinden (of hierom vragen)
3. Alle keys vertalen
4. `locales/fr.json`, `locales/ja.json`, enz. schrijven
5. `.i18n-rosetta.lock` aanmaken om bij te houden wat er is vertaald

## 4. Controleer de resultaten

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

## Wat gebeurt er hierna?

Wanneer u een bronstring wijzigt, detecteert rosetta de wijziging via SHA-256 hash tracking en vertaalt het alleen die key opnieuw bij de volgende synchronisatie:

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

## Optioneel: Maak een configuratiebestand aan

Genereer een configuratiebestand voor meer controle:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

De begeleide wizard leidt u door de **register presets** van elke taal — vooraf gebouwde instructies voor toon/formaliteit die zijn afgestemd op het taalkundige systeem. Frans heeft T-V presets (vouvoiement vs tutoiement), Koreaans heeft spraakniveaus (해요체 vs 합쇼체 vs 해체), Japans heeft keigo-opties (です/ます vs 丁寧語).

Of maak handmatig een configuratie aan met preset-keys:

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

Voer `npx i18n-rosetta init` uit om de beschikbare presets voor elke taal te bekijken.

## Optioneel: Watch Mode

Automatisch vertalen wanneer uw bronbestand wijzigt:

```bash
npx i18n-rosetta watch
```

## Volgende stappen

- **[Configuratie](/docs/getting-started/configuration)** — Volledige configuratiereferentie
- **[Vertaalmethoden](/docs/guides/translation-methods)** — Kies de juiste methode
- **[Framework-integratie](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Automatiseer vertalingen in uw pipeline