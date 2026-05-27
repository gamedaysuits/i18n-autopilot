---
sidebar_position: 7
title: "Voor Enterprise"
description: "Hoe organisaties vertalingen kunnen standaardiseren met op leaderboards bewezen methoden, custom plug-ins en one-command deployment."
---
# i18n-rosetta voor Enterprise

Uw team vertaalt regelmatig content. U heeft een stapel locale-bestanden, een CI-pijplijn en een proces waarbij waarschijnlijk iemand handmatig Google Translate uitvoert, de resultaten naar JSON kopieert en hoopt op het beste. Of u betaalt voor een TMS-platform waarbij u vastzit aan de vertaal-engine van één leverancier.

Er is een betere manier.

## De pitch

1. **Kies de beste methode voor elke taal** — niet de standaardoptie van uw leverancier
2. **Implementeer met één commando** — `npx i18n-rosetta sync` vertaalt elke locale, elk formaat, elke keer
3. **Wissel van methode zonder code te wijzigen** — een configuratiewijziging, geen migratie
4. **Beheer uw eigen pijplijn** — geen vendor lock-in, geen maandelijkse dashboards, geen accounts

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

Frans krijgt DeepL (uw team geeft de voorkeur aan de Europese vloeiendheid). Japans krijgt een frontier LLM. Duits krijgt Google Translate (snel, goedkoop, goed genoeg). Koreaans krijgt een LLM met een formeel register. Plains Cree krijgt een door de community gebouwde gecoachte plug-in die het hoogst scoorde op het leaderboard.

**Hetzelfde commando. Dezelfde CI-pijplijn. Verschillende methoden per talenpaar. Eén configuratiebestand.**

## De Leaderboard → Deploy-workflow

:::tip Binnenkort beschikbaar: `rosetta leaderboard` CLI
De hieronder beschreven workflow is de geplande integratie tussen het [MT Eval Arena](https://mtevalarena.org) leaderboard en de i18n-rosetta CLI. De infrastructuur bestaat aan beide kanten — de brug is in ontwikkeling.
:::

De [MT Eval Arena](https://mtevalarena.org) is de plek waar vertaalmethoden worden gebenchmarkt met reproduceerbare, gefingerprinte scores. Elke methode krijgt een samengestelde score over meerdere statistieken (chrF++, exact match, FST acceptance, semantic scoring). Het leaderboard volgt elke inzending.

De geplande workflow:

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

**U bouwt de methode niet. U traint het model niet. U kiest de winnaar en implementeert deze.** Als er volgende maand een betere methode op het leaderboard verschijnt, wisselt u deze met één commando om.

## Wat er vandaag beschikbaar is

De leaderboard-naar-CLI-brug is in ontwikkeling. Dit is wat er op dit moment werkt:

### Ingebouwde methoden (geen plug-ins nodig)

| Methode | Beste voor | Kosten |
|--------|----------|------|
| `llm` (standaard) | Kwaliteitsgericht, elke taal | Per token via OpenRouter |
| `gemini` | Kwaliteit + gratis niveau | Gratis (beperkt), daarna per token |
| `google-translate` | Snelheid + volume | $20/M tekens |
| `deepl` | Europese talen | $25/M tekens |
| `llm-coached` | Talen met coachingdata | Per token via OpenRouter |
| `api` | Aangepaste/door de community gehoste methoden | Zelf gehost |

### Plug-in methoden (afzonderlijk installeren)

Aangepaste plug-ins kunnen elke vertaallogica omvatten — een gefinetuned model, een FST-gated pijplijn, een community-API of iets anders dat JSON produceert. Zie [Een plug-in bouwen](/docs/tutorials/build-a-plugin).

## Enterprise-workflow

### 1. Evalueer uw huidige kwaliteit

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Voer de eval harness uit op kandidaten

Met de [eval harness](https://mtevalarena.org/docs/specifications/harness) kunt u meerdere methoden benchmarken tegen dezelfde dataset. Voer een sweep uit, vergelijk scores en kies de winnaars:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Configureer winnaars per talenpaar

Werk uw configuratie bij om de beste methode per talenpaar te gebruiken. Verschillende talen hebben verschillende beste methoden — dat is precies het punt.

### 4. Integreer in CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Drie commando's. Nul handmatige vertalingen. De pijplijn vangt hardgecodeerde strings op, vertaalt ze met uw gekozen methoden en laat de build falen als er iets ontbreekt of beschadigd is.

### 5. Professionele beoordeling (optioneel)

Voor cruciale content exporteert u naar XLIFF voor menselijke beoordeling:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Vertaal het grootste deel machinaal. Laat de kritieke paden door mensen beoordelen. Betaal alleen voor menselijke tijd waar dat ertoe doet.

## Kostenmodel

rosetta heeft **geen licentiekosten, geen maandelijks abonnement, geen kosten per gebruiker**. Het is een open-source CLI-tool. U betaalt alleen voor de vertaal-API-aanroepen:

| Volume | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1.000 keys × 5 locales | ~$0,50 | ~$0,30 (gratis niveau) | ~$2,00 |
| 10.000 keys × 15 locales | ~$15 | ~$8 | ~$60 |
| 50.000 keys × 30 locales | ~$75 | ~$40 | ~$300 |

Translation Memory betekent dat u bij volgende synchronisaties alleen betaalt voor **gewijzigde keys**. Als u 10 strings van de 10.000 bijwerkt, betaalt u voor 10 vertalingen, niet voor 10.000.

## vs. TMS-platforms

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Prijzen** | Gratis (open source) + API-kosten | $50–$500/maand + per gebruiker |
| **Vendor lock-in** | Geen — wissel van provider in configuratie | Hoog — data in hun cloud |
| **Methodekeuze** | Elke provider, elk model, per talenpaar | Wat zij aanbieden |
| **CI/CD** | Eersteklas (`lint → sync → audit`) | Plug-in/webhook |
| **Aangepaste methoden** | Plug-insysteem, community-plug-ins | Niet ondersteund |
| **Kwaliteitscontrole** | Ingebouwd (verkeerd script, echo, lengte) | Varieert |
| **Zelf gehost** | Ja (LibreTranslate, aangepaste API) | Nee |

Zie de [volledige vergelijking](/docs/guides/comparison) voor meer details.

## Verder lezen

- **[Snelstart](/docs/getting-started/quick-start)** — voer uw eerste synchronisatie uit in 60 seconden
- **[Vertaalmethoden](/docs/guides/translation-methods)** — het volledige methodemenu met beslissingsboom
- **[CI/CD-integratie](/docs/guides/ci-cd)** — automatiseer in uw pijplijn
- **[Werken met professionele vertalers](/docs/guides/professional-translators)** — XLIFF-export/import
- **[MT Eval Arena](https://mtevalarena.org)** — benchmark en leaderboard
- **[Configuratiereferentie](/docs/getting-started/configuration)** — elke configuratieoptie