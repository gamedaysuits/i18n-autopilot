---
sidebar_position: 2
title: "Vertaal 30 talen"
description: "Cookbook: schaal een project op van 3 naar 30 talen met behulp van methodemixing per talenpaar, batching en CI-integratie."
---
# Kookboek: 30 talen vertalen

Schaal een project van een handvol locales naar wereldwijde dekking. Dit kookboek leidt u door de selectie van methoden, kostenoptimalisatie en CI-integratie voor een echte meertalige implementatie.

**Scenario:** U heeft een SaaS-app met `en`, `fr`, `es`. U moet nog 27 talen toevoegen, verdeeld over drie niveaus van kwaliteitsvereisten.

---

## Stap 1: Categoriseer uw talen

Niet alle 30 talen vereisen dezelfde aanpak. Groepeer ze op basis van de beschikbare methodekwaliteit:

| Niveau | Talen | Methode | Waarom |
|------|-----------|--------|-----|
| **Niveau 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Waardevolle markten, genuanceerde grammatica |
| **Niveau 2 — Standaard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Hoog volume, goed ondersteund door Google |
| **Niveau 3 — Gecoacht** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plug-ins | Low-resource, vereisen handhaving van terminologie |

## Stap 2: Configureer per paar

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

**Opmerking:** Talen die niet in `pairs` staan vermeld, erven `defaultMethod: "google-translate"`. U hoeft niet alle 30 talen te vermelden.

:::info
Ondersteuning voor `crk` is in ontwikkeling — zie [Ondersteun een low-resource taal](https://mtevalarena.org/docs/community/low-resource-languages) voor de status en richtlijnen voor bijdragen.
:::

## Stap 3: Stel API-sleutels in

U heeft beide API-sleutels nodig voor deze configuratie:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Stap 4: Voer eerst een dry run uit

Bekijk altijd een voorbeeld voordat u 30 talen vertaalt:

```bash
npx i18n-rosetta sync --dry
```

Controleer de uitvoer. Deze zal het volgende tonen:
- Welke paren welke methode gebruiken
- Hoeveel keys nieuw of gewijzigd zijn per locale
- Geschatte API-aanroepen per niveau

## Stap 5: Voer de synchronisatie uit

```bash
npx i18n-rosetta sync
```

Rosetta verwerkt elk paar onafhankelijk. De Niveau 2-paren die Google Translate gebruiken, zullen snel zijn. Niveau 1 LLM-paren zullen langzamer zijn, maar van hogere kwaliteit. Niveau 3 gecoachte paren gebruiken de coachingdata van de plug-in.

### Incrementele updates

Na de initiële synchronisatie vertalen volgende uitvoeringen alleen **gewijzigde of nieuwe** keys:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

Het lock-bestand (`.i18n-rosetta.lock`) houdt bij wat er is vertaald, zodat u stabiele inhoud nooit opnieuw vertaalt.

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

Voor een project met 500 bron-keys verdeeld over 30 talen:

| Niveau | Talen | Methode | Geschatte kosten |
|------|-----------|--------|-----------------|
| Niveau 1 (5 talen) | ja, ko, zh, de, pt | GPT-4o | ~$2,50/volledige sync |
| Niveau 2 (18 talen) | it, nl, pl, etc. | Google Translate | ~$0,90/volledige sync |
| Niveau 3 (4 talen) | crk, oj, mi, haw | GPT-4o-mini gecoacht | ~$0,40/volledige sync |
| **Totaal** | **30 talen** | **Gemengd** | **~$3,80/volledige sync** |

Incrementele synchronisaties (5–20 gewijzigde keys) kosten een fractie van een volledige synchronisatie.

## Zie ook

- [Vertaalmethoden](/docs/guides/translation-methods) — Hoe elke vertaalmethode werkt en wanneer u deze moet gebruiken
- [Plug-inspecificatie](/docs/reference/plugin-spec) — Maak coachingdata aan voor elk van uw Niveau 3-talen
- [CI/CD-gids](/docs/guides/ci-cd) — Geavanceerde CI-patronen, inclusief PR-preview-builds
- [Quality Gate](/docs/concepts/quality-gate) — Hoe Rosetta elke vertaling valideert voordat deze wordt weggeschreven
- [Ondersteunde talen](/docs/reference/supported-languages) — Volledige lijst met taalcodes en methodecompatibiliteit
- [Ondersteun een low-resource taal](https://mtevalarena.org/docs/community/low-resource-languages) — Voeg coachingdata toe voor talen zonder brede MT-dekking