---
sidebar_position: 8
title: "Pag-serve ng Custom Method bilang API"
description: "I-wrap ang mga complex translation pipeline (FST gates, multi-step LLM chains) bilang isang HTTP service at i-plug ito sa i18n-rosetta gamit ang api method."
---
# Pag-serve ng Custom Method bilang isang API

Ang **`api` method** ng i18n-rosetta ay nagbibigay-daan sa inyo na i-point ang anumang translation pair sa isang external na HTTP endpoint. Ganito niyo po mai-integrate ang mga pipelines na masyadong complex para sa isang single LLM prompt — mga morphological analyzers, finite-state transducers (FSTs), multi-step LLM chains, o anumang custom research method na na-build ninyo.

## Bakit isang API Service?

May mga translation pipelines na hindi pwedeng mag-run sa loob ng isang simpleng prompt-response cycle:

| Pipeline step | Example |
|---|---|
| **Morphological decomposition** | I-split ang mga polysynthetic words sa mga morphemes bago ang translation |
| **FST validation** | I-reject ang mga outputs na nag-violate ng mga phonological o morphological rules |
| **Multi-step LLM chains** | Generate → verify → correct cycles gamit ang iba't ibang models |
| **Dictionary lookup** | Mag-cross-reference sa isang curated bilingual dictionary mid-pipeline |
| **Human-in-the-loop** | I-queue ang mga uncertain na translations para sa expert review |

Tini-treat ng `api` method ang inyong pipeline bilang isang black box — magse-send ang i18n-rosetta ng mga source strings, at magre-return naman ng translations ang inyong service. Kung ano ang mangyayari sa loob ay nakadepende na po sa inyo.

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

## Pag-set Up ng Inyong Service

Kailangang mag-implement ang inyong API service ng isang single endpoint na nag-a-accept at nagre-return ng JSON:

### Request Format

Ise-send ng rosetta ang eksaktong JSON body na ito (tingnan ang [api.js](https://github.com/gamedaysuits/i18n-rosetta/blob/main/lib/methods/api.js)):

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
| `method` | string | Plugin name o `"default"` |
| `keys` | object | Map ng key → source string na ita-translate |
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
    // --- Dito ilalagay ang inyong pipeline ---
    // Step 1: Morphological decomposition
    const morphemes = await decompose(source, source_locale);

    // Step 2: LLM translation na may context
    const draft = await llmTranslate(morphemes, target_locale);

    // Step 3: FST validation
    const validated = await fstValidate(draft, target_locale);

    // Step 4: Post-processing (orthography normalization, atbp.)
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
# I-clone ang harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# I-run ang evaluation laban sa output ng inyong method
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

1. **Mag-return ng empty strings para sa mga failures** — Huwag i-return ang source string bilang isang "translation." Mag-return ng `""` at hayaan ang fallback prefix mechanism ng i18n-rosetta na mag-handle nito.
2. **Mag-include ng confidence scores** — Kung kaya ng inyong pipeline na mag-estimate ng quality, i-return ito sa metadata. Makakatulong po ito sa quality auditing.
3. **Mag-implement ng health checks** — Mag-add ng `GET /health` endpoint para ma-verify ng i18n-rosetta ang connectivity bago mag-start ng isang malaking sync.
4. **Mag-rate limit nang maayos** — Kung may throughput limits ang inyong pipeline, mag-return ng `429` status codes. Magba-back off ang batch system ng i18n-rosetta.
5. **I-log ang lahat** — Pwedeng mag-fail silently ang mga multi-step pipelines. I-log ang input/output ng bawat step para sa debugging.

## Licensing

Ang `api` method pattern ay fully open — walang licensing restrictions sa pag-wrap ng inyong sariling translation pipeline bilang isang HTTP service. Available ang `gds-mt-eval-harness` sa ilalim ng MIT license para sa mga reference implementations.

## Tingnan Din

- [Translation Methods](/docs/guides/translation-methods) — overview ng bawat built-in method (`openai`, `google`, `api`, atbp.)
- [Plugin Specification](/docs/reference/plugin-spec) — buong schema para sa `i18n-rosetta.config.json` kasama ang `api` method fields
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — end-to-end guide para sa mga under-resourced languages, kasama ang OCAP principles
- [Architecture](/docs/concepts/architecture) — kung paano gumagana ang sync loop, batching, at method dispatch ng i18n-rosetta
- [MT Evaluation](https://mtevalarena.org/docs/leaderboard/rules) — evaluation methodology, metrics, at ang leaderboard submission process
- [Method Leaderboard](/leaderboard) — live quality rankings sa iba't ibang methods at language pairs