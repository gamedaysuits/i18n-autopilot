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
Als u alleen een Google Translate API-sleutel heeft, zal rosetta deze automatisch detecteren en Google Translate als de standaardmethode gebruiken. Er is geen configuratiewijziging nodig.
:::

### "401 Unauthorized" van OpenRouter

Uw API-sleutel is ongeldig of verlopen. Controleer deze op [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Snelheidslimieten (Rate Limiting)

Rosetta verwerkt snelheidslimieten intern met 'exponential backoff' (exponentiële vertraging). Als u consequent tegen snelheidslimieten aanloopt:

1. **Verklein de batchgrootte** in uw configuratie:
   ```json
   { "batchSize": 15 }
   ```
2. **Gebruik een model met hogere snelheidslimieten** (bijv. `google/gemini-3.5-flash` heeft royale limieten)
3. **Gebruik een goedkopere/snellere methode** voor grote volumes — Google Translate heeft geen snelheidslimieten:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404-fouten

Directe LLM-providers (`openai`, `anthropic`, `gemini`) valideren uw modelstring bij het eerste gebruik. Als u een waarschuwing ziet:

**"looks like an OpenRouter path"** — U gebruikt een model in OpenRouter-formaat (`google/gemini-3.5-flash`) bij een directe provider. Directe providers gebruiken kale modelnamen:

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

**"not found in available models"** — Het model is mogelijk verouderd of verkeerd gespeld. Rosetta haalt de actuele modellenlijst van de provider op en stelt alternatieven voor. Raadpleeg de documentatie van de provider voor de huidige modelnamen.

:::tip Modellen kunnen verouderen
Providers trekken regelmatig modelnamen terug. Als vertalingen plotseling mislukken na een update van de provider, controleer dan de `[WARN]`-uitvoer — deze zal u de huidige alternatieven tonen.
:::

## Vertaalkwaliteit

### Vertalingen kopiëren de brontaal

De kwaliteitscontrole (quality gate) vangt dit op. Als een vertaling identiek is aan de Engelse bron, wordt deze afgewezen en opnieuw geprobeerd. Als dit aanhoudt:

1. **Controleer het model** — Sommige modellen presteren slecht bij specifieke talencombinaties
2. **Voeg registerinstructies toe** — Vertel het model welke taal het moet produceren:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Probeer een ander model** — Schakel over van `gpt-4o-mini` naar `gpt-4o` of `google/gemini-2.5-pro`

### Verkeerde schriftuitvoer (bijv. Latijnse tekst voor Japans)

De scriptnalevingscontrole van de kwaliteitscontrole vangt de meeste gevallen op. Als dit aanhoudt:

- Controleer of de landcode (locale code) correct is (`ja`, niet `jp`)
- Voeg expliciete scriptinstructies toe in het `register`-veld:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Hallucinatiepatronen in de uitvoer

Herhaalde trigrampatronen (bijv. "hallo hallo hallo") worden opgevangen door de detector voor hallucinatie-loops. Als de uitvoer onleesbaar is maar wel door de detector komt:

1. **Verklein de batchgrootte** — Kleinere batches produceren een meer gerichte uitvoer
2. **Gebruik een sterker model** — Grotere modellen hallucineren minder bij niet-Latijnse schriften
3. **Voeg coachinggegevens toe** — Woordenboektermen verankeren de vertaling

## Bestands- & Formaatproblemen

### "No locale files found"

Rosetta detecteert locale-bestanden automatisch. Als deze niet gevonden kunnen worden:

1. **Controleer `localesDir`** — Moet verwijzen naar de map die de locale-bestanden bevat:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Controleer de bestandsnamen** — Bestanden moeten vernoemd zijn naar de landcode: `en.json`, `fr.json`, enz.
3. **Controleer het formaat** — Ondersteunde formaten: JSON, geneste JSON, YAML, TOML

### Conflicten met lock-bestanden

Als `.i18n-rosetta.lock` in een slechte staat verkeert:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Het verwijderen van het lock-bestand betekent dat de volgende synchronisatie alle sleutels opnieuw zal vertalen, niet alleen de gewijzigde. Dit heeft gevolgen voor de API-kosten bij grote projecten.
:::

### Specifieke sleutels opnieuw vertalen

Als individuele vertalingen onjuist zijn en u wilt forceren dat deze opnieuw worden vertaald zonder het lock-bestand te verwijderen:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

De `--force-keys`-vlag negeert de hash-controle van het lock-bestand voor die specifieke sleutels, waardoor hervertaling wordt geforceerd zonder andere sleutels te beïnvloeden.

### Contentvertaling beschadigt codeblokken

Dit zou niet mogen gebeuren — codeblokken worden afgeschermd vóór de vertaling. Als dit toch gebeurt:

1. Controleer of het codeblok standaard markeringen gebruikt (drie backticks)
2. Controleer op niet-afgesloten codeblokken in de bron-Markdown
3. Dien een issue in — dit is een bug in het sentinel-afschermingssysteem

## CLI-problemen

### `--watch` detecteert geen wijzigingen

Bestandsbewaking (file watching) gebruikt de native `fs.watch` van Node.js. Bekende problemen:

- **Netwerkschijven** — `fs.watch` werkt niet betrouwbaar op NFS/SMB-mounts
- **Docker-volumes** — Gebruik de polling-modus of voer rosetta uit binnen de container
- **Grote mappen** — De watcher bewaakt `localesDir` recursief; zeer diepe boomstructuren kunnen de limieten van het besturingssysteem overschrijden

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

Rosetta vertaalt standaard alle locales parallel. Als de synchronisatie nog steeds traag is:

1. **Gebruik Google Translate voor grote volumes** — Het is 10–50× sneller dan LLM-vertaling
2. **Vergroot de batchgrootte** (standaard is 80):
   ```json
   { "batchSize": 120 }
   ```
3. **Pas de gelijktijdigheid (concurrency) aan** — JSON-locale-parallellisme is standaard 50 en content 12. Als uw API-provider hogere snelheidslimieten ondersteunt:
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **Gebruik een snel model** — `gpt-4o-mini` is aanzienlijk sneller dan `gpt-4o`

### Hoge API-kosten

- **Controleer batchgroottes** — Grotere batches = minder API-aanroepen = lagere kosten
- **Gebruik Translation Memory** — TM staat standaard aan. Voer `i18n-rosetta tm stats` uit om te controleren of het werkt. Als u na meerdere synchronisaties 0 vermeldingen ziet, is er mogelijk iets mis met de machtigingen van uw `.rosetta/`-map
- **Gebruik prompt caching** — Rosetta splitst systeem-/gebruikersberichten voor cache-hits op Anthropic- en Google-modellen
- **Gebruik Google Translate voor Tier 2-talen** — Zie het [Translate 30 Languages](/docs/tutorials/translate-30-languages)-kookboek

### Verouderde vertalingen na het wisselen van provider

Als u overschakelt van de ene vertaalmethode naar de andere (bijv. van `llm` naar `deepl`), kan de TM-cache nog steeds oude vertalingen van de vorige methode leveren voor sleutels waarvan de brontekst niet is gewijzigd. De cache-sleutel bevat de naam van de methode, dus de meeste gevallen worden automatisch afgehandeld. Maar als u `model` binnen dezelfde methode heeft gewijzigd:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Zie [Translation Memory](/docs/concepts/translation-memory) voor details over het ontwerp van cache-sleutels.

## Nog steeds problemen?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Zoek in bestaande issues of dien een nieuwe in
- **[Architecture Docs](/docs/concepts/architecture)** — Begrijp het systeemontwerp
- **[Quality Gate](/docs/concepts/quality-gate)** — Hoe validatie onder de motorkap werkt