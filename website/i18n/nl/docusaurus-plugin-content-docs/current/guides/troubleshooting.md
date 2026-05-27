---
sidebar_position: 6
title: "Probleemoplossing"
---
# Probleemoplossing

Veelvoorkomende problemen en oplossingen voor i18n-rosetta.

## API & Authenticatie

### "OPENROUTER_API_KEY not found"

Rosetta vereist een API-sleutel voor LLM-vertaling. Stel deze in als een omgevingsvariabele:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Of in een `.env`-bestand (als uw project `.env`-bestanden laadt):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Als u alleen een Google Translate API-sleutel heeft, detecteert rosetta dit automatisch en gebruikt het Google Translate als de standaardmethode. Er is geen configuratiewijziging nodig.
:::

### "401 Unauthorized" van OpenRouter

Uw API-sleutel is ongeldig of verlopen. Controleer deze op [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Rate Limiting

Rosetta verwerkt rate limits intern met een exponentiële backoff. Als u consequent tegen rate limits aanloopt:

1. **Verklein de batchgrootte** in uw configuratie:
   ```json
   { "batchSize": 15 }
   ```
2. **Gebruik een model met hogere rate limits** (bijv. `google/gemini-3.5-flash` heeft ruime limieten)
3. **Gebruik een goedkopere/snellere methode** voor paren met een hoog volume — Google Translate heeft geen rate limits:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404-fouten

Directe LLM-providers (`openai`, `anthropic`, `gemini`) valideren uw modelstring bij het eerste gebruik. Als u een waarschuwing ziet:

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

**"not found in available models"** — Het model is mogelijk verouderd of verkeerd gespeld. Rosetta haalt de actuele modellijst van de provider op en stelt alternatieven voor. Raadpleeg de documentatie van de provider voor de huidige modelnamen.

:::tip Veroudering van modellen komt voor
Providers trekken regelmatig modelnamen terug. Als vertalingen plotseling mislukken na een update van een provider, controleer dan de uitvoer van `[WARN]` — deze toont u de huidige alternatieven.
:::

## Vertaalkwaliteit

### Vertalingen weerspiegelen de brontaal

De quality gate vangt dit op. Als een vertaling identiek is aan de Engelse bron, wordt deze afgewezen en opnieuw geprobeerd. Als dit aanhoudt:

1. **Controleer het model** — Sommige modellen presteren slecht voor specifieke talenparen
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

- Controleer of de localecode correct is (`ja`, niet `jp`)
- Voeg expliciete scriptinstructies toe in het `register`-veld:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Hallucinatiepatronen in de uitvoer

Herhaalde trigrampatronen (bijv. "hallo hallo hallo") worden opgevangen door de hallucination loop detector. Als de uitvoer onleesbaar is maar de detector passeert:

1. **Verklein de batchgrootte** — Kleinere batches produceren een meer gerichte uitvoer
2. **Gebruik een sterker model** — Grotere modellen hallucineren minder bij niet-Latijnse scripts
3. **Voeg coachinggegevens toe** — Woordenboektermen verankeren de vertaling

## Bestands- & Formaatproblemen

### "No locale files found"

Rosetta detecteert locale-bestanden automatisch. Als het deze niet kan vinden:

1. **Controleer `localesDir`** — Moet verwijzen naar de map die de locale-bestanden bevat:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Controleer de bestandsnaamgeving** — Bestanden moeten worden vernoemd naar de localecode: `en.json`, `fr.json`, enz.
3. **Controleer het formaat** — Ondersteunde formaten: JSON, geneste JSON, YAML, TOML

### Lock file-conflicten

Als `.i18n-rosetta.lock` in een slechte staat raakt:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Het verwijderen van de lock file betekent dat de volgende synchronisatie alle sleutels opnieuw zal vertalen, niet alleen de gewijzigde. Dit heeft gevolgen voor de API-kosten bij grote projecten.
:::

### Specifieke sleutels opnieuw vertalen

Als individuele vertalingen onjuist zijn en u wilt forceren dat ze opnieuw worden vertaald zonder de lock file te verwijderen:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

De `--force-keys`-vlag negeert de hash-controle van de lock file voor die specifieke sleutels, waardoor hervertaling wordt geforceerd zonder andere sleutels te beïnvloeden.

### Contentvertaling beschadigt codeblokken

Dit zou niet moeten gebeuren — codeblokken worden afgeschermd vóór de vertaling. Als dit toch gebeurt:

1. Controleer of het codeblok standaard markeringen gebruikt (drie backticks)
2. Controleer op niet-gesloten codeblokken in de bron-Markdown
3. Dien een issue in — dit is een bug in het sentinel shielding-systeem

## CLI-problemen

### `--watch` detecteert geen wijzigingen

Bestandsbewaking gebruikt de native `fs.watch` van Node.js. Bekende problemen:

- **Netwerkschijven** — `fs.watch` werkt niet betrouwbaar op NFS/SMB-mounts
- **Docker-volumes** — Gebruik de polling-modus of voer rosetta uit binnen de container
- **Grote mappen** — De watcher bewaakt `localesDir` recursief; zeer diepe bomen kunnen de limieten van het besturingssysteem overschrijden

### `npx` voert een oude versie uit

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

Rosetta vertaalt paren standaard sequentieel. Om meertalige synchronisaties te versnellen:

1. **Gebruik Google Translate voor paren met een hoog volume** — Het is 10 tot 50 keer sneller dan LLM-vertaling
2. **Vergroot de batchgrootte** (tot 50, standaard is 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Gebruik een snel model** — `gpt-4o-mini` is aanzienlijk sneller dan `gpt-4o`

### Hoge API-kosten

- **Controleer batchgroottes** — Grotere batches = minder API-aanroepen = lagere kosten
- **Gebruik Translation Memory** — TM is standaard ingeschakeld. Voer `i18n-rosetta tm stats` uit om te controleren of het werkt. Als u 0 vermeldingen ziet na meerdere synchronisaties, is er mogelijk iets mis met de machtigingen van uw `.rosetta/`-map
- **Gebruik prompt caching** — Rosetta splitst systeem-/gebruikersberichten voor cache hits op Anthropic- en Google-modellen
- **Gebruik Google Translate voor Tier 2-talen** — Zie het [Translate 30 Languages](/docs/tutorials/translate-30-languages) kookboek

### Verouderde vertalingen na het wisselen van providers

Als u overschakelt van de ene vertaalmethode naar de andere (bijv. van `llm` naar `deepl`), kan de TM-cache nog steeds oude vertalingen van de vorige methode leveren voor sleutels waarvan de brontekst niet is gewijzigd. De cache-sleutel bevat de methodenaam, dus de meeste gevallen worden automatisch afgehandeld. Maar als u `model` binnen dezelfde methode heeft gewijzigd:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Zie [Translation Memory](/docs/concepts/translation-memory) voor details over het ontwerp van de cache-sleutel.

## Loopt u nog steeds vast?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Zoek in bestaande issues of dien een nieuwe in
- **[Architecture Docs](/docs/concepts/architecture)** — Begrijp het systeemontwerp
- **[Quality Gate](/docs/concepts/quality-gate)** — Hoe validatie onder de motorkap werkt