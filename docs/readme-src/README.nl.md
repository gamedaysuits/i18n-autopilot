# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README-vertalingen** — *vertaald door rosetta, natuurlijk:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Vertaal uw locale-bestanden met één commando:

```bash
npx i18n-rosetta sync
```

Rosetta detecteert automatisch uw locale-bestanden, hun formaat en de doeltalen. Het vertaalt ontbrekende sleutels, slaat over wat al gedaan is en schrijft de resultaten weg. Dat is alles.

## Waarom het niet zelf scripten?

U zou een snel script kunnen schrijven dat door uw Engelse sleutels loopt en Google Translate aanroept. De meeste ontwikkelaars doen dit – het kost ongeveer 30 regels. Hier is waarom het misgaat:

- **Geen wijzigingsdetectie.** Wanneer u een Engelse string bijwerkt, blijft de vertaling voor altijd verouderd. Rosetta volgt elke bronwaarde met SHA-256 hashes en vertaalt alleen opnieuw wat is gewijzigd.
- **Geen batching.** Eén API-aanroep per sleutel betekent 200 sleutels = 200 round trips. Rosetta batchet intelligent (configureerbaar, standaard 30 sleutels/batch voor LLM, 128 voor Google).
- **Geen kwaliteitscontrole.** Machinevertaling hallucineert, herhaalt de bron of geeft uitvoer in het verkeerde schrift. Rosetta valideert elke vertaling voordat deze wordt weggeschreven – verkeerd schrift, lengte-inflatie en bronherhalingen worden opgevangen en afgewezen.
- **Geen formaatbewustzijn.** Hardcoded naar JSON? Rosetta verwerkt JSON, TOML, YAML en Hugo Markdown (frontmatter + body) met automatische detectie.
- **Geen veiligheid.** Rosetta beschermt tegen prototype pollution, path traversal via zorgvuldig opgestelde locale-codes en corruptie van codeblokken tijdens Markdown-vertaling.

Rosetta is de productieversie van dat script.

## Snelle start

```bash
npm install --save-dev i18n-rosetta
```

### Verkrijg een API-sleutel

Rosetta heeft een vertaalbackend nodig. Kies er een:

| Provider | Sleutel | Het beste voor |
|----------|-----|----------|
| **OpenRouter** (aanbevolen) | `OPENROUTER_API_KEY` | Content-heavy projecten, Markdown, 200+ modellen |
| **OpenAI** | `OPENAI_API_KEY` | Directe GPT-4o toegang |
| **Anthropic** | `ANTHROPIC_API_KEY` | Directe Claude toegang |
| **Gemini** | `GEMINI_API_KEY` | Gratis tier beschikbaar |
| **DeepL** | `DEEPL_API_KEY` | Europese talen, glossary support |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130+ talen, hoog volume |

**Snelste start** (gratis): Meld u aan op [aistudio.google.com](https://aistudio.google.com/apikey) voor een gratis Gemini-sleutel:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200+ modellen): Meld u aan op [openrouter.ai](https://openrouter.ai), daarna:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** alternatief (alleen sleutel-waarde paren — geen Markdown-bewustzijn):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Opmerking**: Als alleen `GOOGLE_TRANSLATE_API_KEY` is ingesteld, schakelt rosetta automatisch over naar Google Translate. Geen configuratiewijziging nodig. Gebruikt de REST API direct — geen SDK, geen service account, geen `pip install`. Alleen de sleutel.

Dat is het. Voor meer controle, maak een configuratiebestand aan:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Elke taal wordt geleverd met **register presets** — vooraf gebouwde toon/formaliteitsinstructies afgestemd op het linguïstische systeem (vouvoiement voor Frans, Siezen voor Duits, です/ます voor Japans, 해요체 voor Koreaans). De init wizard laat u presets doorbladeren en kiezen, of `--yes` doorgeven om de standaardinstellingen te accepteren.

### Niet-Engelse bron

Als uw brontaal geen Engels is:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

Of stel het permanent in uw configuratie in:

```json
{ "inputLocale": "fr" }
```

## Wat het doet

U beheert het i18n-framework (next-intl, i18next, Hugo). Rosetta beheert de vertaalbestanden.

- **Multi-formaat** — JSON, TOML, YAML en Hugo Markdown (front matter + body)
- **Incrementieel** — Vertaalt alleen wat is gewijzigd (SHA-256 hash tracking)
- **Kwaliteitsgecontroleerd** — Valideert elke vertaling: vangt hallucinaties, verkeerde-script uitvoer, bronherhalingen en lengte-inflatie op
- **Content-bewust** — LLM-methoden beschermen codeblokken, shortcodes, links en interpolatievariabelen tijdens Markdown-vertaling
- **Pijplijn tools** — `lint`, `audit`, `integrity`, `seo` voor CI gates
- **Nul afhankelijkheden** — Alleen Node.js built-ins. Geen SDK's, geen native modules. Vereist Node 20+

## Voorbij Google Translate

De snelle start laat u aan de slag gaan met een LLM of Google Translate. Maar Google Translate ondersteunt ~130 talen. Er zijn er meer dan 7.000.

**Rosetta's kernidee: de vertaalmethode is configureerbaar per taalpaar.** Gebruik Google Translate voor Frans, een LLM met morfologische coaching voor Plains Cree, en een community-gehoste API voor Quechua — allemaal in hetzelfde project, allemaal met dezelfde CLI.

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

Als u kunt uitvinden hoe u een taalpaar kunt vertalen — via prompt engineering, community-woordenboeken, FST-pijplijnen of fijn afgestemde modellen — dan kunt u met rosetta die methode als een plugin verpakken en naast al het andere implementeren.

> Ontstaan uit het vertalen van een productiewebsite naar Plains Cree, waar geen kant-en-klare API bestaat. De per-paar architectuur is niet theoretisch — het bestaat omdat één project Google Translate nodig had voor Frans en een gecoachte FST-pijplijn voor een inheemse taal, naast elkaar draaiend in hetzelfde sync-commando.

De bijbehorende [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) stelt u in staat om vertaalbenaderingen te benchmarken en te vergelijken, en vervolgens werkende methoden als rosetta-plugins te exporteren. Iedereen die beide talen spreekt, kan een vertaalmethode ontwikkelen, testen en delen — geen eigen platform vereist.

### Kies uw methode

Rosetta ondersteunt 10 vertaalmethoden. Elk taalpaar kan een andere methode gebruiken.

**LLM providers** — het beste voor kwaliteit, Markdown-bewust, coaching-compatibel:

| Methode | Sleutel | Wat het doet |
|--------|-----|-------------|
| `llm` (standaard) | `OPENROUTER_API_KEY` | LLM via OpenRouter — 200+ modellen, auto-routing |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + grammaticaregels, woordenboeken, stijlinstructies |
| `openai` | `OPENAI_API_KEY` | Directe OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Directe Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Directe Google Gemini API (Flash, Pro) — gratis tier beschikbaar |

**Traditionele MT** — het beste voor snelheid, kosten en grote volumes sleutel-waarde paren:

| Methode | Sleutel | Wat het doet |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ talen) |
| `deepl` | `DEEPL_API_KEY` | DeepL API met glossary support (30+ talen) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ talen) |
| `libretranslate` | *(zelf gehost)* | Zelf gehoste LibreTranslate (AGPL, gratis) |

**Infrastructuur** — voor aangepaste of community-gehoste endpoints:

| Methode | Sleutel | Wat het doet |
|--------|-----|-------------|
| `api` | *(per provider)* | Dunne HTTP-client voor elk REST-endpoint |

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

> **Opmerking**: Traditionele MT-methoden (Google Translate, DeepL, Microsoft Translator, LibreTranslate) verwerken sleutel-waardeparen goed, maar kunnen Markdown-inhoud niet veilig vertalen. Voor content-heavy projecten worden LLM-methoden aanbevolen — deze beschermen expliciet codeblokken, shortcodes en interpolatievariabelen.

## Plugins

Plugins zijn vooraf verpakte vertaalrecepten voor specifieke taalparen. Het zijn JSON-manifesten — geen code — die rosetta vertellen welke methode te gebruiken, met welke instellingen, en welke kwaliteit is gebenchmarkt.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Zie [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) voor het manifestformaat.

## Commando's

| Commando | Doel |
|---------|---------|
| `init` | Interactieve setup wizard (of `--yes` voor snelle standaardinstellingen) |
| `sync` | Vertaal & synchroniseer alle locale-bestanden |
| `watch` | Automatisch synchroniseren bij bestandswijzigingen |
| `audit` | Markeer onvolledige locales (CI gate) |
| `lint` | Vind hardcoded strings in broncode |
| `wrap` | Automatisch hardcoded strings omwikkelen in `t()` aanroepen (met ongedaan maken) |
| `seo` | Genereer hreflang, sitemap.xml of JSON-LD schema |
| `integrity` | Controleer op placeholder-corruptie en encoding-problemen |
| `status` | Toon paarconfiguratie, methoden, registers en kwaliteitsniveaus |
| `provenance` | Audit licenties voor vertaalbronnen |
| `plugin` | Installeer, verwijder of toon method plugins |

Voer `i18n-rosetta <command> --help` uit voor gedetailleerde hulp bij elk commando.

Volledige referentie: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Configuratie

Maak `i18n-rosetta.config.json` aan of voer `i18n-rosetta init` uit:

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

| Optie | Standaard | Beschrijving |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Bron-taalcode |
| `localesDir` | `"./locales"` | Pad naar locale-bestanden |
| `contentDir` | `null` | Hugo content directory (activeert Markdown-vertaling) |
| `format` | `"auto"` | Bestandsformaat: `json`, `toml`, `yaml`, of `auto` |
| `model` | `"google/gemini-3.5-flash"` | Standaard OpenRouter-model |
| `defaultMethod` | `"llm"` | Standaard vertaalmethode (overruled door `--method` flag) |
| `batchSize` | `30` | Sleutels per vertaalbatch |
| `pairs` | `{}` | Per-paar methode, model en kwaliteits-overrides |

**Per-taal overrides**: Elke taal heeft een [Taalkaart](docs/planning/LANGUAGE_CARD_SPEC.md) met vooraf ingestelde registers afgestemd op het formaliteitssysteem. Gebruik vooraf ingestelde sleutels als afkorting, of schrijf aangepaste registertekst:

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

**Zero-config modus**: Geen configuratiebestand? Rosetta detecteert automatisch locale-bestanden, formaat en doeltalen vanuit uw project.

Taalwaarden kunnen een preset-sleutel zijn (bijv. `"casual-tu"`), aangepaste registertekst, of een object (volledige controle). Overrides op paarniveau in `pairs` hebben prioriteit boven instellingen op taalniveau. Voer `npx i18n-rosetta init` uit om de beschikbare presets voor elke taal te bekijken.

Framework setup guides: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Verharding

- **Exponentiële backoff** — 3 herhalingen met jitter bij 429/5xx fouten
- **30s request timeout** — AbortController voorkomt vastlopen
- **Response validatie** — accepteert alleen sleutels die voor vertaling zijn verzonden
- **Kwaliteitscontrole** — vangt hallucinatie-loops, verkeerde-script uitvoer, lengte-inflatie en bronherhalingen op
- **Retry cascade** — bij JSON parse-fout, herhaalt batch → half-batch → individuele sleutels (budget-capped via `maxRetries`)
- **Prompt caching** — systeem/gebruikersbericht splitsing maakt caching op providerniveau mogelijk, waardoor tokencost over batches wordt verminderd
- **Prototype pollution guard** — blokkeert `__proto__`, `constructor`, `prototype`
- **Padbeperking** — bestandsschrijvingen gevalideerd om binnen geconfigureerde directories te blijven
- **Blokbescherming** — codeblokken, shortcodes, HTML beschermd tijdens contentvertaling
- **Expliciete fallback** — `--fallback` schrijft `[EN]`-voorvoegsel placeholders wanneer de API niet beschikbaar is (opnieuw synchroniseren met een sleutel voor echte vertalingen)
- **Gedeeltelijk succes** — één mislukte batch blokkeert de rest niet

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

**Nul afhankelijkheden.**

## Licentie

MIT