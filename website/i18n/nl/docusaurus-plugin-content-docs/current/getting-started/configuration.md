---
sidebar_position: 3
title: "Configuratie"
---
# Configuratie

Rosetta werkt zero-config — het detecteert automatisch locale-bestanden, het formaat en de doeltalen van uw project. Voor meer controle kunt u `i18n-rosetta.config.json` aanmaken in de root van uw project, of het volgende uitvoeren:

```bash
npx i18n-rosetta init
```

## Volledige configuratiereferentie

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 30,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen is nog niet geïmplementeerd
Het `typegen` configuratieblok wordt herkend en behouden door de configuratielader, maar TypeScript type-generatie is nog niet geïmplementeerd. Dit is een tijdelijke aanduiding voor een geplande functie. Het instellen van deze waarden heeft geen effect.
:::


### Velden

| Veld | Type | Standaard | Beschrijving |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Versie van het configuratieschema. Altijd `3`. |
| `inputLocale` | `string` | `"en"` | Bron-taalcode (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Pad naar locale-bestanden. Rosetta scant deze map. |
| `contentDir` | `string` | `null` | Hugo content-map. Schakelt vertaling van Markdown-body in. |
| `translatableFields` | `string[]` | `null` | Overschrijf standaard vertaalbare frontmatter-velden voor contentvertaling. `null` gebruikt ingebouwde standaarden (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | Bestandsformaat: `json`, `toml`, `yaml`, of `auto` (detecteren via extensie). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Standaardmodel voor LLM-methoden. Formaat is afhankelijk van de methode: OpenRouter gebruikt `provider/model` (bijv. `google/gemini-3.5-flash`); directe providers gebruiken kale namen (bijv. `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Standaard vertaalmethode: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Wordt overschreven door de `--method` CLI-vlag. |
| `batchSize` | `number` | `30` | Keys per vertaalbatch. Hoger = minder API-aanroepen, maar grotere prompts. |
| `fallbackPrefix` | `string` | `"[EN] "` | Voorvoegsel toegevoegd aan onvertaalde fallback-waarden. Gebruikt door `audit` om onvolledige vertalingen te detecteren. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Naam van de omgevingsvariabele voor de API-sleutel. Overschrijven voor aangepaste namen van omgevingsvariabelen. |
| `baseUrl` | `string` | `""` | Basis-URL voor het genereren van SEO-artefacten (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Overschrijvingen per paar voor methode, model en kwaliteit. Zie [Paarconfiguratie](#pair-configuration). |
| `languages` | `object` | `{}` | Overschrijvingen per taal. Zie [Taalconfiguratie](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Bronmap voor lint-scanning. `null` = automatisch detecteren via framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Glob-patronen om uit te sluiten van lint. |
| `lint.minLength` | `number` | `2` | Minimale stringlengte om te markeren als hardcoded. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | URL-patroonsjabloon voor het genereren van hreflang-tags. |
| `seo.pages` | `string[]` | `null` | Expliciete paginalijst voor SEO. `null` = automatisch detecteren via locale-keys. |
| `typegen.output` | `string` | `null` | Uitvoerpad voor gegenereerde TypeScript-types. `null` = uitgeschakeld. |
| `typegen.autoGenerate` | `boolean` | `false` | Types automatisch opnieuw genereren na elke sync. |

## Paarconfiguratie

Elk bron→doel-paar kan onafhankelijk worden geconfigureerd:

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### Paarvelden

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `method` | `string` | Vertaalmethode: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Naam van een geïnstalleerde plug-in (uit `.rosetta/methods/`) |
| `model` | `string` | Overschrijf het standaardmodel voor dit paar |
| `endpoint` | `string` | Remote API-eindpunt-URL. Vereist wanneer `method` is ingesteld op `api`. |
| `qualityTier` | `string` | Weergaveniveau (tier): `standard`, `high`, `research`, `verified` |

## Taalconfiguratie

Talen accepteren drie formaten:

### Array van codes (eenvoudigst)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Elke taal krijgt zijn standaardregister uit de ingebouwde registertabel. Talen zonder standaardwaarde krijgen `"Professional register."`.

### Object met registerstrings

De waarde kan een **preset-sleutel** van de taalkaart zijn, of een aangepaste registertekst:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta controleert of de string overeenkomt met een preset-sleutel in de taalkaart. Als dit het geval is, wordt de volledige registerprompt van de kaart gebruikt. Zo niet, dan wordt de string ongewijzigd gebruikt. Zie [Ondersteunde talen](/docs/reference/supported-languages#language-cards) voor beschikbare presets.

### Object met volledige configuratie

```json
{
  "languages": {
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

U kunt verkorte en volledige objecten in hetzelfde blok combineren.


### Taalvelden

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `register` | `string` | Instructies voor stijl/toon. Kan een **preset-sleutel** zijn (bijv. `casual-tu`, `formal-hapsyo`) of aangepaste tekst. Zie [Taalkaarten](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Menselijk leesbare taalnaam (voor statusweergave) |
| `model` | `string` | Overschrijf het standaardmodel |
| `batchSize` | `number` | Overschrijf de standaard batchgrootte |
| `maxRetries` | `number` | Maximaal budget voor nieuwe pogingen bij mislukte batches (standaard: 3) |
| `script` | `string` | ISO 15924-scriptcode. Activeert scriptvalidatie in de kwaliteitscontrole (quality gate). |

:::info Overervingsketen
Instellingen worden in deze volgorde opgelost (de eerste wint):

**paarniveau** → **taalniveau** → **globale configuratie** → **standaardwaarden**

Als `pairs["en:fr"]` bijvoorbeeld `model` instelt, overschrijft dit zowel de `model`-waarden op taalniveau als de globale waarden.
:::

## Niet-Engelse bron

Als uw brontaal niet Engels is:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Lock-bestand

Rosetta maakt `.i18n-rosetta.lock` aan om SHA-256-hashes van vertaalde bronwaarden bij te houden. **Commit dit bestand** zodat alle ontwikkelaars dezelfde vertaalbasis delen.

Wanneer een bronwaarde verandert, komt de hash niet meer overeen en vertaalt Rosetta die key opnieuw bij de volgende sync.

## `.rosettaignore`

Maak `.rosettaignore` aan in de root van uw project om bestanden uit te sluiten van `lint`-scanning. Gebruikt glob-patronen, zoals `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

---

## Programmatische API

Voor build-scripts en aangepaste integraties kunt u rechtstreeks vanuit het pakket importeren:

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Beschikbare exports

| Export | Wat het doet |
|--------|-------------|
| `TranslationMethod` | Basisklasse voor alle methoden |
| `LLMMethod` | Basisklasse voor LLM-methoden (OpenRouter) |
| `DirectLLMMethod` | Basisklasse voor directe LLM-providers (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Directe LLM-providerklassen |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Traditionele MT-klassen |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Gecoachte LLM (OpenRouter + coachinggegevens) |
| `APIMethod` | Remote API-client |
| `runSync`, `runContentSync` | Volledige sync-pijplijn |
| `resolveConfig`, `resolvePairs` | Configuratie-resolutie |
| `validateTranslations` | Kwaliteitscontrole (quality gate) |
| `loadCoachingData`, `findDictionaryMatches` | Hulpprogramma's voor coaching |

### Aangepaste provider-extensie

Breid `DirectLLMMethod` uit om een nieuwe LLM-provider toe te voegen in ~40 regels:

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

U krijgt vertaling, coaching, retry-loops, modelvalidatie, kwaliteitsniveaus en instellingshulp gratis. Alleen de vorm van het HTTP-verzoek is providerspecifiek. Voor niet-LLM-adapters die ruwe `fetch()` gebruiken, gebruikt u de gedeelde `fetchWithRetry()`-helper van `lib/methods/fetch-with-retry.js` in plaats van uw eigen retry-loop te schrijven.

---

## Zie ook

- [CLI-referentie](/docs/reference/cli) — alle opdrachten en vlaggen
- [Vertaalmethoden](/docs/guides/translation-methods) — methoden kiezen en combineren
- [Plug-inspecificatie](/docs/reference/plugin-spec) — manifestformaat voor methode-plug-ins
- [Architectuur](/docs/concepts/architecture) — hoe de onderdelen met elkaar verbonden zijn
- [Ondersteunde talen](/docs/reference/supported-languages) — ingebouwde taalondersteuning
- [Hoe Sync werkt](/docs/concepts/how-sync-works) — de vertaalpijplijn