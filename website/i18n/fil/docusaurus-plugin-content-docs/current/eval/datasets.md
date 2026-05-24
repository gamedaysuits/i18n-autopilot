---
sidebar_position: 3
title: "Mga Evaluation Dataset"
---
# Evaluation Datasets

Ang mga dataset po ang mga fixed targets na pinapatakbo ng harness. Ang bawat dataset ay isang JSON file na naglalaman ng source→target pairs na may gold-standard references. Ini-score ng harness ang mga model output laban sa mga references na ito — hindi po nito kailanman binabago ang mga ito.

:::danger HUWAG MAG-TRAIN sa evaluation data

⚠️ **Ang mga dataset na ito ay para sa evaluation-only.** Ang mga method na na-train, na-fine-tune, na-few-shot-prompt, o na-expose sa evaluation data ay magpo-produce ng artificially inflated scores at madi-**disqualify mula sa leaderboard.**

Gumamit po ng hiwalay na corpora para sa training. Ang mga evaluation set ay dapat manatiling unseen ng inyong model during development.
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
| `version` | `string` | Semantic version. Ang pag-increment nito ay mag-i-invalidate sa mga nakaraang run card comparisons |
| `language_pair` | `string` | Display label (hal., `EN→CRK`) |
| `description` | `string` | Human-readable summary |
| `source_language` | `string` | BCP 47 source language code |
| `target_language` | `string` | BCP 47 target language code |
| `created` | `string` | ISO 8601 creation date |
| `license` | `string` | SPDX license identifier |
| `provenance` | `string[]` | List ng mga provenance tag na ginamit sa mga entry |

### Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `index` | `number` | Zero-based entry index. Dapat unique at sequential |
| `source_text` | `string` | Ang source text na ita-translate |
| `target_expected` | `string` | Ang gold-standard reference translation |
| `difficulty` | `string` | Difficulty tier: `easy`, `medium`, `hard` |
| `provenance` | `string` | Origin ng entry na ito (hal., `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Optional context para sa mga human reviewer |

---

## Available Datasets

### EDTeKLA Development Set v1

Ang unang evaluation dataset, na binuo para sa English→Plains Cree (SRO) translation. Ginawa po ito ng [EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/) sa University of Alberta.

| Property | Value |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Version** | `1.0` |
| **Language pair** | EN → CRK (Plains Cree, SRO orthography) |
| **Entry count** | 124 |
| **Difficulty distribution** | Easy, Medium, Hard |
| **Provenance** | `gold_standard` (verified ng mga speaker), `textbook` (published educational materials) |
| **License** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Ano ang tine-test nito:**

- Basic greetings at common phrases
- Noun animacy at obviation
- Verb conjugation across persons at tenses
- Locative constructions
- Possessive paradigms
- Complex sentence structures

:::tip Bakit 124 entries?
Sinadya pong maliit at curated ang dataset. Ang bawat entry ay na-verify ng mga fluent speaker o kinuha mula sa mga published Cree language textbooks. Ang isang maliit at high-quality dataset na may verified gold standards ay mas kapaki-pakinabang kaysa sa isang malaki at noisy na dataset — lalo na para sa isang low-resource language kung saan ang mga "close enough" na translation ay madalas na morphologically invalid.
:::

---

## Paggawa ng Bagong Dataset

Para gumawa ng dataset para sa isang bagong language pair o domain:

### 1. I-structure ang JSON

Sundin po ang [Dataset Format](#dataset-format) schema. Ang bawat entry ay dapat mayroong `source_text`, `target_expected`, `difficulty`, at `provenance`.

### 2. Mag-assign ng unique ID

Gumamit ng descriptive slug: `{project}-{split}-v{version}` (hal., `edtekla-dev-v1`, `quechua-test-v1`).

### 3. I-verify ang gold standards

Ang bawat `target_expected` value ay dapat ma-verify ng isang fluent speaker o kunin mula sa isang published, peer-reviewed resource. Ang mga machine-generated references ay nakakasira sa layunin ng evaluation.

### 4. I-set ang difficulty tiers

Bigyan ang bawat entry ng difficulty level:

| Tier | Criteria |
|------|----------|
| `easy` | Short phrases, common vocabulary, simple morphology |
| `medium` | Full sentences, moderate morphological complexity |
| `hard` | Complex grammar, rare constructions, culturally specific content |

### 5. I-tag ang provenance

Dapat i-indicate ng bawat entry kung saan ito nagmula. Mga common tag:

- `gold_standard` — Na-verify ng mga fluent speaker
- `textbook` — Mula sa mga published educational materials
- `elicited` — Na-produce sa pamamagitan ng structured elicitation sessions
- `corpus` — Na-extract mula sa isang parallel corpus

### 6. I-validate ang file

I-run ang harness laban sa inyong dataset gamit ang anumang model para ma-verify na well-formed ang JSON at present ang lahat ng required fields:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

Mag-e-error ang harness kapag may missing fields, duplicate indices, o schema violations.

### 7. I-submit para sa inclusion

Mag-open po ng pull request sa [eval harness repository](https://github.com/gamedaysuits/gds-mt-eval-harness) kasama ang inyong dataset file sa `data/` directory. I-include ang documentation ng inyong verification methodology at provenance sources.

---

## FLORES+ Devtest

Isang broad-coverage multilingual benchmark na minementina ng [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Ginagamit ito para sa multi-model frontier benchmark ng rosetta.

| Property | Value |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Language pairs** | EN → 39 languages (lahat ng rosetta registered natural languages) |
| **Entry count** | 1,012 sentences per language |
| **License** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Source** | Originally Meta FLORES-200, ngayon ay OLDI-maintained na |
| **Location** | Pre-extracted fixtures sa `test/benchmark/fixtures/` sa main rosetta repo |

:::danger Evaluation only
Ang FLORES+ ay inilaan lamang para sa evaluation. Mahigpit na nire-request ng mga curator na **huwag itong gamitin bilang training data**. Siguraduhin po na naka-exclude ang contents nito mula sa anumang training corpora.
:::

---

## Tingnan Din

- [MT Evaluation](/docs/eval/) — overview ng evaluation framework at leaderboard
- [Eval Harness](/docs/eval/harness) — paano mag-run ng evaluations laban sa mga dataset na ito
- [Run Card Specification](/docs/eval/run-card) — ang JSON schema para sa pag-record ng results
- [Method Leaderboard](/leaderboard) — live benchmark scores
- [EdTeKLA Project](https://spaces.facsci.ualberta.ca/edtekla/) — ang University of Alberta research group sa likod ng Cree dataset