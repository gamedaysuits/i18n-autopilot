---
sidebar_position: 3
title: "Mga Evaluation Dataset"
---
# Mga Evaluation Dataset

Ang mga dataset ay ang mga fixed target kung saan nagra-run ang harness. Ang bawat dataset ay isang JSON file na naglalaman ng mga source→target pair na may mga gold-standard reference. Ini-score ng harness ang mga model output laban sa mga reference na ito — hindi po nito kailanman mino-modify ang mga ito.

:::danger HUWAG MAG-TRAIN sa evaluation data

⚠️ **Ang mga dataset na ito ay para sa evaluation lamang.** Ang mga method na na-train, na-fine-tune, na-few-shot-prompt, o na-expose sa evaluation data ay magpo-produce ng artificially inflated na mga score at madi-**disqualify mula sa leaderboard.**

Gumamit po ng hiwalay na corpora para sa training. Ang mga evaluation set ay dapat manatiling unseen ng inyong model habang nasa development.
:::

---

## Dataset Format

Ang bawat dataset ay sumusunod sa parehong JSON schema:

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### Top-Level `dataset` Block

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique dataset identifier (ginagamit sa mga run card at leaderboard) |
| `version` | `string` | Semantic version. Ang pag-increment nito ay mag-i-invalidate sa mga nakaraang run card comparison |
| `language_pair` | `string` | Display label (hal., `EN→CRK`) |
| `description` | `string` | Human-readable na summary |
| `source_language` | `string` | BCP 47 source language code |
| `target_language` | `string` | BCP 47 target language code |
| `created` | `string` | ISO 8601 creation date |
| `license` | `string` | SPDX license identifier |
| `provenance` | `string[]` | Listahan ng mga provenance tag na ginamit sa mga entry |

### Mga Entry Field

| Field | Type | Description |
|-------|------|-------------|
| `index` | `number` | Zero-based entry index. Dapat ay unique at sequential |
| `source_text` | `string` | Ang source text na ita-translate |
| `target_expected` | `string` | Ang gold-standard reference translation |
| `difficulty` | `string` | Difficulty tier: `easy`, `medium`, `hard` |
| `provenance` | `string` | Pinagmulan ng entry na ito (hal., `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Optional na context para sa mga human reviewer |

---

## Mga Available Dataset

### EDTeKLA Development Set v1

Ang unang evaluation dataset, na binuo para sa English→Plains Cree (SRO) translation. Ginawa ito ng [EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/) sa University of Alberta.

| Property | Value |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Version** | `1.0` |
| **Language pair** | EN → CRK (Plains Cree, SRO orthography) |
| **Entry count** | 124 |
| **Difficulty distribution** | Easy, Medium, Hard |
| **Provenance** | `gold_standard` (na-verify ng mga speaker), `textbook` (mga published educational material) |
| **License** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Ano ang tinetest nito:**

- Mga basic greeting at common phrase
- Noun animacy at obviation
- Verb conjugation sa iba't ibang person at tense
- Mga locative construction
- Mga possessive paradigm
- Mga complex sentence structure

:::tip Bakit 124 entries?
Sadyang maliit at curated ang dataset na ito. Ang bawat entry ay na-verify ng mga fluent speaker o kinuha mula sa mga published Cree language textbook. Ang isang maliit at high-quality na dataset na may mga verified gold standard ay mas kapaki-pakinabang kaysa sa isang malaki at noisy na dataset — lalo na para sa isang low-resource language kung saan ang mga "close enough" na translation ay madalas na morphologically invalid.
:::

---

## Pag-create ng Bagong Dataset

Para mag-create ng dataset para sa isang bagong language pair o domain:

### 1. I-structure ang JSON

Sundin po ang [Dataset Format](#dataset-format) schema. Ang bawat entry ay dapat may `source_text`, `target_expected`, `difficulty`, at `provenance`.

### 2. Mag-assign ng unique ID

Gumamit ng descriptive slug: `{project}-{split}-v{version}` (hal., `edtekla-dev-v1`, `quechua-test-v1`).

### 3. I-verify ang mga gold standard

Ang bawat `target_expected` value ay dapat ma-verify ng isang fluent speaker o makuha mula sa isang published, peer-reviewed resource. Ang mga machine-generated reference ay nakakasira sa layunin ng evaluation.

### 4. I-set ang mga difficulty tier

Mag-assign ng difficulty level sa bawat entry:

| Tier | Criteria |
|------|----------|
| `easy` | Mga short phrase, common vocabulary, simple morphology |
| `medium` | Mga full sentence, moderate morphological complexity |
| `hard` | Complex grammar, mga rare construction, culturally specific content |

### 5. I-tag ang provenance

Dapat i-indicate ng bawat entry kung saan ito nagmula. Mga common tag:

- `gold_standard` — Na-verify ng mga fluent speaker
- `textbook` — Mula sa mga published educational material
- `elicited` — Na-produce sa pamamagitan ng mga structured elicitation session
- `corpus` — Na-extract mula sa isang parallel corpus

### 6. I-validate ang file

I-run ang harness laban sa inyong dataset gamit ang kahit anong model para ma-verify na well-formed ang JSON at present ang lahat ng required field:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

Mag-e-error ang harness kapag may mga missing field, duplicate index, o schema violation.

### 7. I-submit para sa inclusion

Mag-open po ng pull request sa [eval harness repository](https://github.com/gamedaysuits/gds-mt-eval-harness) kasama ang inyong dataset file sa `data/` directory. Mag-include ng documentation ng inyong verification methodology at mga provenance source.

---

## FLORES+ Devtest

Isang broad-coverage multilingual benchmark na minemaintain ng [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Ginagamit ito para sa multi-model frontier benchmark ng rosetta.

| Property | Value |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Language pairs** | EN → 39 languages (lahat ng registered natural language ng rosetta) |
| **Entry count** | 1,012 sentence bawat language |
| **License** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Source** | Originally Meta FLORES-200, ngayon ay OLDI-maintained na |
| **Location** | Mga pre-extracted fixture sa `test/benchmark/fixtures/` sa main rosetta repo |

:::danger Para sa evaluation lamang
Ang FLORES+ ay inilaan solely para sa evaluation. Explicitly na nire-request ng mga curator na **huwag itong gamitin bilang training data**. Siguraduhin po na ang mga content nito ay naka-exclude sa anumang training corpora.
:::

---

## Tingnan Din

- [MT Evaluation](/docs/eval/) — overview ng evaluation framework at leaderboard
- [Eval Harness](/docs/eval/harness) — kung paano mag-run ng mga evaluation laban sa mga dataset na ito
- [Run Card Specification](/docs/eval/run-card) — ang JSON schema para sa pag-record ng mga result
- [Method Leaderboard](/leaderboard) — mga live benchmark score
- [EdTeKLA Project](https://spaces.facsci.ualberta.ca/edtekla/) — ang research group ng University of Alberta sa likod ng Cree dataset