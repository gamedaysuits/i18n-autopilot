---
sidebar_position: 8
title: "Een aangepaste methode als API aanbieden"
description: "Verpak complexe vertaalpijplijnen (FST-gates, multi-step LLM-chains) als een HTTP-service en integreer deze in i18n-rosetta via de api-methode."
---
# Een Custom Method als API aanbieden

De **`api` method** van i18n-rosetta stelt u in staat om elk vertaalpaar naar een extern HTTP-endpoint te verwijzen. Dit is hoe u pipelines integreert die te complex zijn voor een enkele LLM-prompt — morfologische analysatoren, finite-state transducers (FST's), multi-step LLM-chains, of elke andere custom onderzoeksmethode die u heeft gebouwd.

## Waarom een API-service?

Sommige vertaal-pipelines kunnen niet binnen een eenvoudige prompt-response cyclus draaien:

| Pipeline-stap | Voorbeeld |
|---|---|
| **Morfologische decompositie** | Splits polysynthetische woorden in morfemen vóór vertaling |
| **FST-validatie** | Wijs outputs af die fonologische of morfologische regels schenden |
| **Multi-step LLM-chains** | Genereer → verifieer → corrigeer cycli met verschillende modellen |
| **Woordenboek raadplegen** | Raadpleeg een gecureerd tweetalig woordenboek halverwege de pipeline |
| **Human-in-the-loop** | Plaats onzekere vertalingen in de wachtrij voor beoordeling door een expert |

De `api` method behandelt uw pipeline als een black box — i18n-rosetta verstuurt source strings, uw service retourneert vertalingen. Wat er binnenin gebeurt, is volledig aan u.

## Architectuur

```mermaid
graph LR
    A[i18n-rosetta sync] -->|POST /translate| B[Your API Service]
    B --> C[Step 1: Decompose]
    C --> D[Step 2: LLM Translate]
    D --> E[Step 3: FST Validate]
    E --> F[Step 4: Post-process]
    F -->|JSON response| A
```

## Uw Service Instellen

Uw API-service moet één enkel endpoint implementeren dat JSON accepteert en retourneert:

### Request-formaat

rosetta verstuurt exact deze JSON-body (zie [api.js](https://github.com/gamedaysuits/i18n-rosetta/blob/main/lib/methods/api.js)):

```json
POST /translate
Content-Type: application/json
Authorization: Bearer <ROSETTA_API_KEY>

{
  "source_locale": "en",
  "target_locale": "crk",
  "method": "crk-coached-v1",
  "keys": {
    "greeting": "Hello, welcome to our app",
    "farewell": "Goodbye and thanks"
  }
}
```

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `source_locale` | string | BCP 47 brontaalcode |
| `target_locale` | string | BCP 47 doeltaalcode |
| `method` | string | Plugin-naam of `"default"` |
| `keys` | object | Map van key → source string om te vertalen |
```

### Response Format

Your service must return a `translations` object. An optional `meta` object can include cost and diagnostic info:

```json
{
  "translations": {
    "greeting": "tânisi, pê-kîwêw ôta",
    "farewell": "ekosi mâka, kinanâskomitin"
  },
  "meta": {
    "model": "my-custom-pipeline/v1",
    "cost_usd": 0.0042,
    "method": "decompose-translate-validate"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `translations` | object | ✅ | Map of key → translated string |
| `meta` | object | — | Optional metadata |
| `meta.cost_usd` | number | — | If present, displayed in rosetta's output |
| `errors` | object | — | For partial success (HTTP 207): map of key → `{ message }` |

### Minimal Express Server

```javascript
import express from 'express';

const app = express();
app.use(express.json());

/**
 * rosetta API contract:
 *
 * Request:  { source_locale, target_locale, method, keys: { "key": "source" } }
 * Response: { translations: { "key": "translated" }, meta: { ... } }
 */
app.post('/translate', async (req, res) => {
  const { source_locale, target_locale, method, keys } = req.body;

  const translations = {};

  for (const [key, source] of Object.entries(keys)) {
    // --- Your pipeline goes here ---
    // Step 1: Morphological decomposition
    const morphemes = await decompose(source, source_locale);

    // Step 2: LLM translation with context
    const draft = await llmTranslate(morphemes, target_locale);

    // Step 3: FST validation
    const validated = await fstValidate(draft, target_locale);

    // Step 4: Post-processing (orthography normalization, etc.)
    translations[key] = await postProcess(validated);
  }

  res.json({
    translations,
    meta: {
      model: 'my-custom-pipeline/v1',
      method: 'decompose-translate-validate',
    },
  });
});

app.listen(3001, () => {
  console.log('Translation API running on http://localhost:3001');
});
```

## Configuring i18n-rosetta

Point a translation pair at your running service in `i18n-rosetta.config.json`:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en:crk": {
      "method": "api",
      "endpoint": "http://localhost:3001/translate",
      "register": "Formal Plains Cree. Use SRO orthography."
    }
  }
}
```

Then run sync as usual:

```bash
npx i18n-rosetta sync
```

i18n-rosetta will POST your source strings to the endpoint and write the returned translations to `crk.json`.

## Case Study: Plains Cree Pipeline

:::info Under Development
The Plains Cree pipeline described below is **under active development** and is not yet running in production. Details here reflect the current design direction and may change as the project evolves.
:::

The **gds-mt-eval-harness** project demonstrates this pattern. Its Plains Cree pipeline uses:

1. **Morphological decomposition** — Break polysynthetic Cree words into translatable morpheme chains
2. **LLM translation** — Context-enriched GPT-4o translation with coaching data (SRO orthography rules, register instructions)
3. **FST validation** — Finite-state transducer checks that outputs conform to Cree phonological rules
4. **Confidence scoring** — Each translation gets a confidence score based on FST pass rate and dictionary coverage

The entire pipeline runs as a single HTTP endpoint that i18n-rosetta calls via the `api` method.

### Running Evaluations

After translating, you can evaluate output quality using the harness directly:

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run the evaluation against your method's output
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit
```

This produces structured evaluation records with chrF++, BLEU, and exact match scores that can be used as regression baselines.

## Authentication

If your API requires authentication, set the `apiKey` field or use an environment variable:

```json
{
  "pairs": {
    "en:crk": {
      "method": "api",
      "endpoint": "https://my-mt-service.example.com/translate",
      "apiKey": "${CRK_API_KEY}"
    }
  }
}
```

## Data Sovereignty & OCAP Principles

The `api` method is particularly important for **Indigenous language communities**. By self-hosting the translation pipeline, a community keeps full control over:

- **Proprietary coaching data** — register instructions, orthography rules, and domain glossaries never leave community infrastructure.
- **Linguistic resources** — curated dictionaries, FST grammars, and elder-verified translations remain under community ownership.
- **Access policies** — the community decides who can call the endpoint and under what terms.

This aligns with [OCAP® principles](https://mtevalarena.org/docs/community/low-resource-languages#ocap-principles) (Ownership, Control, Access, Possession), ensuring that sensitive language data is governed by the community rather than a third-party platform.

:::tip
Combine the `api` method with a private deployment (e.g., a community-hosted VM or on-prem server) for the strongest data-sovereignty posture. See [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) for a full walkthrough.
:::

## Cost Estimation

The `api` method returns `null` for cost estimation by default — your service controls pricing. If you want to provide cost transparency, have your API return a `cost` field in the metadata:

```json
{
  "translations": { "...": "..." },
  "metadata": {
    "cost": {
      "estimatedCost": 0.0042,
      "currency": "USD",
      "source": "my-service-pricing"
    }
  }
}
```

## Best Practices

1. **Retourneer lege strings bij fouten** — Retourneer de source string niet als een "vertaling". Retourneer `""` en laat het fallback-prefixmechanisme van i18n-rosetta dit afhandelen.
2. **Voeg confidence scores toe** — Als uw pipeline de kwaliteit kan inschatten, retourneer dit dan in de metadata. Dit helpt bij kwaliteitsaudits.
3. **Implementeer health checks** — Voeg een `GET /health` endpoint toe zodat i18n-rosetta de connectiviteit kan verifiëren voordat een grote sync wordt gestart.
4. **Pas graceful rate limiting toe** — Als uw pipeline doorvoerlimieten heeft, retourneer dan `429` statuscodes. Het batchsysteem van i18n-rosetta zal dan een back-off toepassen.
5. **Log alles** — Multi-step pipelines kunnen stilzwijgend falen. Log de input/output van elke stap voor debugging.

## Licenties

Het `api` method-patroon is volledig open — er zijn geen licentiebeperkingen op het verpakken van uw eigen vertaal-pipeline als een HTTP-service. De `gds-mt-eval-harness` is beschikbaar onder de MIT-licentie voor referentie-implementaties.

## Zie ook

- [Vertaalmethoden](/docs/guides/translation-methods) — overzicht van elke ingebouwde method (`openai`, `google`, `api`, enz.)
- [Plugin-specificatie](/docs/reference/plugin-spec) — volledig schema voor `i18n-rosetta.config.json` inclusief `api` method-velden
- [Een Low-Resource Taal Ondersteunen](https://mtevalarena.org/docs/community/low-resource-languages) — end-to-end gids voor talen met weinig middelen, inclusief OCAP-principes
- [Architectuur](/docs/concepts/architecture) — hoe de sync-loop, batching en method-dispatch van i18n-rosetta werken
- [MT-evaluatie](https://mtevalarena.org/docs/leaderboard/rules) — evaluatiemethodologie, metrieken en het indieningsproces voor het leaderboard
- [Method Leaderboard](/leaderboard) — live kwaliteitsranglijsten over methods en vertaalparen heen