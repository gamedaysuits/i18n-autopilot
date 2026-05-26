---
sidebar_position: 2
title: "30 talen vertalen"
description: "Cookbook: een project opschalen van 3 naar 30 talen met behulp van per-pair method mixing, batching en CI-integratie."
---
# Cookbook: 30 talen vertalen

Schaal een project van een handvol locales naar wereldwijde dekking. Dit cookbook leidt u door de selectie van methoden, kostenoptimalisatie en CI-integratie voor een echte meertalige implementatie.

**Scenario:** U heeft een SaaS-app met `en`, `fr`, `es`. U moet 27 extra talen toevoegen, verdeeld over drie niveaus van kwaliteitsvereisten.

---

## Stap 1: Categoriseer uw talen

Niet alle 30 talen vereisen dezelfde aanpak. Groepeer ze op basis van de beschikbare kwaliteit van de methode:

| Niveau | Talen | Methode | Reden |
|------|-----------|--------|-----|
| **Niveau 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Waardevolle markten, genuanceerde grammatica |
| **Niveau 2 — Standaard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Groot volume, goed ondersteund door Google |
| **Niveau 3 — Gecoacht** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Low-resource, vereist handhaving van terminologie |

## Stap 2: Configureer per talenpaar

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

**Opmerking:** Talen die niet in `pairs` worden vermeld, erven `defaultMethod: "google-translate"`. U hoeft niet alle 30 talen te vermelden.

:::info
De ondersteuning voor `crk` is in ontwikkeling — zie [Een low-resource taal ondersteunen](https://mtevalarena.org/docs/community/low-resource-languages) voor de status en richtlijnen voor bijdragen.
:::

## Stap 3: API-sleutels instellen

U heeft beide API-sleutels nodig voor deze configuratie:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Stap 4: Eerst proefdraaien

Bekijk altijd een voorbeeld voordat u 30 talen vertaalt:

```bash
npx i18n-rosetta sync --dry
```

Controleer de uitvoer. Deze toont:
- Welke talenparen welke methode gebruiken
- Hoeveel sleutels nieuw/gewijzigd zijn per locale
- Geschatte API-aanroepen per niveau

## Stap 5: Voer de synchronisatie uit

```bash
npx i18n-rosetta sync
```

Rosetta verwerkt elk talenpaar onafhankelijk. De Niveau 2-paren die Google Translate gebruiken, zullen snel zijn. Niveau 1 LLM-paren zullen langzamer zijn, maar van hogere kwaliteit. Niveau 3 gecoachte paren gebruiken de coachingdata van de plug-in.

### Incrementele updates

Na de initiële synchronisatie vertalen volgende uitvoeringen alleen **gewijzigde of nieuwe** sleutels:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

Het lockbestand (`.i18n-rosetta.lock`) houdt bij wat er is vertaald, zodat u stabiele inhoud nooit opnieuw vertaalt.

## Stap 6: Controleer de kwaliteit

Controleer de status van alle talenparen:

```bash
npx i18n-rosetta status
```

Dit levert een tabel op die voor elk paar de methode, het model, het kwaliteitsniveau toont, en of er coachingdata of benchmarkscores beschikbaar zijn.

## Stap 7: CI-integratie

Voeg dit toe aan uw GitHub Actions-workflow, zodat vertalingen bij elke push actueel blijven:

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

## Kostenraming

Voor een project met 500 bronsleutels verdeeld over 30 talen:

| Niveau | Talen | Methode | Geschatte kosten |
|------|-----------|--------|-----------------|
| Niveau 1 (5 talen) | ja, ko, zh, de, pt | GPT-4o | ~$2,50/volledige sync |
| Niveau 2 (18 talen) | it, nl, pl, etc. | Google Translate | ~$0,90/volledige sync |
| Niveau 3 (4 talen) | crk, oj, mi, haw | GPT-4o-mini gecoacht | ~$0,40/volledige sync |
| **Totaal** | **30 talen** | **Gemengd** | **~$3,80/volledige sync** |

Incrementele synchronisaties (5–20 gewijzigde sleutels) kosten een fractie van een volledige synchronisatie.

## Zie ook

- [Vertaalmethoden](/docs/guides/translation-methods) — Hoe elke vertaalmethode werkt en wanneer u deze moet gebruiken
- [Plug-in specificatie](/docs/reference/plugin-spec) — Maak coachingdata aan voor al uw Niveau 3-talen
- [CI/CD-gids](/docs/guides/ci-cd) — Geavanceerde CI-patronen inclusief PR-preview builds
- [Quality Gate](/docs/concepts/quality-gate) — Hoe Rosetta elke vertaling valideert voordat deze wordt weggeschreven
- [Ondersteunde talen](/docs/reference/supported-languages) — Volledige lijst van taalcodes en compatibiliteit van methoden
- [Een low-resource taal ondersteunen](https://mtevalarena.org/docs/community/low-resource-languages) — Voeg coachingdata toe voor talen zonder brede MT-dekking