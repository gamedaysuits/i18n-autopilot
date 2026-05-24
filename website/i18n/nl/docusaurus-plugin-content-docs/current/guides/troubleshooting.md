---
sidebar_position: 6
title: "Probleemoplossing"
---
# Probleemoplossing

Veelvoorkomende problemen en oplossingen voor i18n-rosetta.

## API & Authenticatie

### "OPENROUTER_API_KEY not found"

Rosetta vereist een API key voor LLM-vertaling. Stel deze in als een omgevingsvariabele:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Of in een `.env`-bestand (als uw project `.env`-bestanden laadt):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Als u alleen een Google Translate API key heeft, zal rosetta deze automatisch detecteren en Google Translate als de standaardmethode gebruiken. Er is geen configuratiewijziging nodig.
:::

### "401 Unauthorized" van OpenRouter

Uw API key is ongeldig of verlopen. Controleer deze op [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Rate Limiting

Rosetta verwerkt rate limits intern met exponential backoff. Als u consequent tegen rate limits aanloopt:

1. **Verlaag de batch size** in uw configuratie:
   ```json
   { "batchSize": 15 }
   ```
2. **Gebruik een model met hogere rate limits** (bijv. `google/gemini-3.5-flash` heeft ruime limieten)
3. **Gebruik een goedkopere/snellere methode** voor grote volumes — Google Translate heeft geen rate limits:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404-fouten

Directe LLM-providers (`openai`, `anthropic`, `gemini`) valideren uw model string bij het eerste gebruik. Als u een waarschuwing ziet:

**"looks like an OpenRouter path"** — U gebruikt een model in OpenRouter-formaat (`google/gemini-3.5-flash`) met een directe provider. Directe providers gebruiken kale modelnamen:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Of schakel over naar de `llm`-methode om OpenRouter te gebruiken:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — U stuurt een model naar de verkeerde provider:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Het model is mogelijk verouderd (deprecated) of verkeerd gespeld. Rosetta haalt de actuele modellenlijst van de provider op en stelt alternatieven voor. Raadpleeg de documentatie van de provider voor de huidige modelnamen.

:::tip Model deprecation komt voor
Providers trekken regelmatig modelnamen terug. Als vertalingen plotseling mislukken na een update van de provider, controleer dan de `[WARN]`-uitvoer — deze toont u de huidige alternatieven.
:::

## Vertaalkwaliteit

### Vertalingen kopiëren de brontaal

De quality gate vangt dit op. Als een vertaling identiek is aan de Engelse bron, wordt deze afgewezen en opnieuw geprobeerd. Als dit aanhoudt:

1. **Controleer het model** — Sommige modellen presteren slecht voor specifieke talencombinaties
2. **Voeg registerinstructies toe** — Vertel het model welke taal het moet produceren:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Probeer een ander model** — Schakel over van `gpt-4o-mini` naar `gpt-4o` of `google/gemini-2.5-pro`

### Verkeerde scriptuitvoer (bijv. Latijnse tekst voor Japans)

De script compliance check van de quality gate vangt de meeste gevallen op. Als dit aanhoudt:

- Controleer of de locale-code correct is (`ja`, niet `jp`)
- Voeg expliciete scriptinstructies toe in het `register`-veld:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Hallucinatiepatronen in uitvoer

Herhaalde trigrampatronen (bijv. "hallo hallo hallo") worden opgevangen door de hallucination loop detector. Als de uitvoer onleesbaar is maar de detector passeert:

1. **Verlaag de batch size** — Kleinere batches produceren meer gerichte uitvoer
2. **Gebruik een sterker model** — Grotere modellen hallucineren minder bij niet-Latijnse scripts
3. **Voeg coaching data toe** — Woordenboektermen verankeren de vertaling

## Bestands- & Formaatproblemen

### "No locale files found"

Rosetta detecteert locale-bestanden automatisch. Als deze niet gevonden kunnen worden:

1. **Controleer `localesDir`** — Moet verwijzen naar de map die de locale-bestanden bevat:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Controleer de bestandsnaamgeving** — Bestanden moeten worden benoemd op basis van de locale-code: `en.json`, `fr.json`, enz.
3. **Controleer het formaat** — Ondersteunde formaten: JSON, geneste JSON, YAML, TOML

### Lock file-conflicten

Als `.i18n-rosetta.lock` in een slechte staat terechtkomt:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Het verwijderen van de lock file betekent dat de volgende synchronisatie alle sleutels opnieuw zal vertalen, niet alleen de gewijzigde. Dit heeft gevolgen voor de API-kosten bij grote projecten.
:::

### Specifieke sleutels opnieuw vertalen

Als individuele vertalingen onjuist zijn en u wilt forceren dat deze opnieuw worden vertaald zonder de lock file te verwijderen:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

De `--force-keys`-vlag negeert de hash-controle van de lock file voor die specifieke sleutels, waardoor hervertaling wordt geforceerd zonder andere sleutels te beïnvloeden.

### Contentvertaling beschadigt codeblokken

Dit zou niet moeten gebeuren — codeblokken worden afgeschermd vóór de vertaling. Als dit toch gebeurt:

1. Controleer of het codeblok standaard fencing gebruikt (drie backticks)
2. Controleer op niet-gesloten codeblokken in de bron-Markdown
3. Maak een issue aan — dit is een bug in het sentinel shielding-systeem

## CLI-problemen

### `--watch` detecteert geen wijzigingen

File watching gebruikt de native `fs.watch` van Node.js. Bekende problemen:

- **Netwerkschijven** — `fs.watch` werkt niet betrouwbaar op NFS/SMB-mounts
- **Docker-volumes** — Gebruik de polling-modus of draai rosetta binnen de container
- **Grote mappen** — De watcher monitort `localesDir` recursief; zeer diepe bomen kunnen de limieten van het besturingssysteem overschrijden

### `npx` draait een oude versie

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Of installeer globaal:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Prestaties

### Synchronisatie is traag voor veel talen

Rosetta vertaalt talencombinaties standaard sequentieel. Om meertalige synchronisaties te versnellen:

1. **Gebruik Google Translate voor grote volumes** — Het is 10–50× sneller dan LLM-vertaling
2. **Verhoog de batch size** (tot 50, standaard is 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Gebruik een snel model** — `gpt-4o-mini` is aanzienlijk sneller dan `gpt-4o`

### Hoge API-kosten

- **Controleer batch sizes** — Grotere batches = minder API-aanroepen = lagere kosten
- **Gebruik prompt caching** — Rosetta splitst systeem-/gebruikersberichten voor cache hits op Anthropic- en Google-modellen
- **Gebruik Google Translate voor Tier 2-talen** — Zie het [Translate 30 Languages](/docs/tutorials/translate-30-languages) kookboek

## Loopt u nog steeds vast?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Zoek in bestaande issues of maak een nieuwe aan
- **[Architecture Docs](/docs/concepts/architecture)** — Begrijp het systeemontwerp
- **[Quality Gate](/docs/concepts/quality-gate)** — Hoe validatie onder de motorkap werkt