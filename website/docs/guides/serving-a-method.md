---
sidebar_position: 8
title: Serving a Custom Method as an API
description: Wrap complex translation pipelines (FST gates, multi-step LLM chains) as an HTTP service and plug them into i18n-rosetta via the api method.
---

# Serving a Custom Method as an API

i18n-rosetta's **`api` method** lets you point any translation pair at an external HTTP endpoint. This is how you integrate pipelines that are too complex for a single LLM prompt — morphological analyzers, finite-state transducers (FSTs), multi-step LLM chains, or any custom research method you've built.

## Why an API Service?

Some translation pipelines can't run inside a simple prompt-response cycle:

| Pipeline step | Example |
|---|---|
| **Morphological decomposition** | Split polysynthetic words into morphemes before translation |
| **FST validation** | Reject outputs that violate phonological or morphological rules |
| **Multi-step LLM chains** | Generate → verify → correct cycles with different models |
| **Dictionary lookup** | Cross-reference a curated bilingual dictionary mid-pipeline |
| **Human-in-the-loop** | Queue uncertain translations for expert review |

The `api` method treats your pipeline as a black box — i18n-rosetta sends source strings, your service returns translations. What happens inside is entirely up to you.

## Architecture

```mermaid
graph LR
    A[i18n-rosetta sync] -->|POST /translate| B[Your API Service]
    B --> C[Step 1: Decompose]
    C --> D[Step 2: LLM Translate]
    D --> E[Step 3: FST Validate]
    E --> F[Step 4: Post-process]
    F -->|JSON response| A
```

## Setting Up Your Service

Your API service must implement a single endpoint that accepts and returns JSON:

### Request Format

rosetta sends this exact JSON body (see [api.js](https://github.com/gamedaysuits/i18n-rosetta/blob/main/lib/methods/api.js)):

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

| Field | Type | Description |
|-------|------|-------------|
| `source_locale` | string | BCP 47 source language code |
| `target_locale` | string | BCP 47 target language code |
| `method` | string | Plugin name or `"default"` |
| `keys` | object | Map of key → source string to translate |
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

This aligns with [OCAP® principles](/docs/guides/low-resource-languages#ocap-principles) (Ownership, Control, Access, Possession), ensuring that sensitive language data is governed by the community rather than a third-party platform.

:::tip
Combine the `api` method with a private deployment (e.g., a community-hosted VM or on-prem server) for the strongest data-sovereignty posture. See [Support a Low-Resource Language](/docs/guides/low-resource-languages) for a full walkthrough.
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

1. **Return empty strings for failures** — Don't return the source string as a "translation." Return `""` and let i18n-rosetta's fallback prefix mechanism handle it.
2. **Include confidence scores** — If your pipeline can estimate quality, return it in metadata. This helps with quality auditing.
3. **Implement health checks** — Add a `GET /health` endpoint so i18n-rosetta can verify connectivity before starting a large sync.
4. **Rate limit gracefully** — If your pipeline has throughput limits, return `429` status codes. i18n-rosetta's batch system will back off.
5. **Log everything** — Multi-step pipelines can fail silently. Log each step's input/output for debugging.

## Licensing

The `api` method pattern is fully open — there are no licensing restrictions on wrapping your own translation pipeline as an HTTP service. The `gds-mt-eval-harness` is available under MIT license for reference implementations.

## See Also

- [Translation Methods](/docs/guides/translation-methods) — overview of every built-in method (`openai`, `google`, `api`, etc.)
- [Plugin Specification](/docs/reference/plugin-spec) — full schema for `i18n-rosetta.config.json` including `api` method fields
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — end-to-end guide for under-resourced languages, including OCAP principles
- [Architecture](/docs/concepts/architecture) — how i18n-rosetta's sync loop, batching, and method dispatch work
- [MT Evaluation](/docs/eval/) — evaluation methodology, metrics, and the leaderboard submission process
- [Method Leaderboard](/leaderboard) — live quality rankings across methods and language pairs
