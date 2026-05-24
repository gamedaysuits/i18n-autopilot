---
sidebar_position: 4
title: "Method Interface"
---
# Shared Method Interface

Ang eval harness at i18n-rosetta ay may shared common concept na **translation method**. Ang method ay kahit anong procedure na kumukuha ng source text at nagpo-produce ng translated text — whether ito man ay isang direct LLM call, isang multi-stage pipeline, isang third-party API, o isang human translator.

## Architecture

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Dalawang System, Isang Interface

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Language** | Python | Node.js |
| **Entry point** | `translate.py` | `translate.js` |
| **Interface** | `TranslationProcess` protocol | `methodPlugin` config |
| **Purpose** | Batch evaluation na may scoring | Live localization sa dev/CI |
| **Output** | Run card na may metrics | Translated locale files |

Ang isang method na nagsu-support sa parehong systems ay nagpo-provide ng dalawang entry points — isa para sa bawat language runtime. Ang **method card** ang nagsisilbing tulay: dini-describe nito ang method sa isang format na naiintindihan ng parehong systems.

## Method Card

Dini-describe ng isang method card kung *ano* ang isang translation method nang hindi nire-reveal ang mga proprietary details tulad ng buong system prompt. Sinasagot nito ang:

- Anong class ng method ito? (raw LLM, coached LLM, pipeline, API, etc.)
- Anong tools ang ginagamit nito? (FST analyzer, dictionary, etc.)
- Open source ba ang implementation?
- Anong language pairs ang sinusuportahan nito?

Tingnan po ang [Method Card Spec](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) para sa buong JSON schema.

### Example

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### Method Classes

| Class | Description |
|-------|-------------|
| `raw-llm` | Direct LLM call na may minimal instruction |
| `coached-llm` | LLM na may structured prompt, examples, at constraints |
| `pipeline` | Multi-stage pipeline na may deterministic components |
| `custom-plugin` | External process na nag-i-implement ng `TranslationProcess` protocol |
| `api` | Third-party translation API (Google Translate, DeepL, etc.) |
| `human` | Human translation (para sa pag-establish ng baselines) |

## Eval Harness: TranslationProcess Protocol

Gumagamit ang eval harness ng structural typing ng Python (`Protocol`) para sa mga plugins. Kahit anong class na may tamang method signature ay gagana — no inheritance required:

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Tingnan ang [Plugin Protocol](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) para sa kumpletong documentation kasama ang mga wrapper examples para sa mga non-Python methods.

## i18n-rosetta: methodPlugin Config

Sa rosetta, ang mga methods ay naka-register per language pair sa `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

Tingnan ang [Plugin Spec](/docs/reference/plugin-spec) para sa rosetta-side interface.

## Leaderboard Integration

Kapag may method card na naka-attach sa isang run (via `--method-card`), naka-embed ito sa run card at idi-display sa leaderboard:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

Ipinapakita ng leaderboard ang:
- **Class badge** — visual indicator (e.g., "pipeline", "coached-llm")
- **Method name** — mula sa method card
- **Tools used** — naka-list mula sa method card
- **Open source indicator**

Kapag walang naka-attach na method card, ipapakita ng leaderboard ang harness-native configuration (model, condition, temperature, tools enabled).

:::danger DO NOT TRAIN sa evaluation data
Ang mga methods na ang development process ay na-expose sa evaluation dataset — bilang training data, few-shot examples, dictionary entries, o prompt tuning material — ay madi-**disqualify** sa leaderboard. Tingnan po ang [MT Evaluation](/docs/eval/) para malaman kung ano ang pinagkaiba ng magandang method sa masama.
:::

---

## Tingnan Din

- [MT Evaluation](/docs/eval/) — overview, leaderboard value, at good/bad method guidance
- [Eval Harness](/docs/eval/harness) — kung paano mag-run ng evaluations
- [Evaluation Datasets](/docs/eval/datasets) — mga available na datasets (EDTeKLA, FLORES+)
- [Run Card Specification](/docs/eval/run-card) — ang run card JSON schema
- [Plugin Spec](/docs/reference/plugin-spec) — rosetta-side plugin interface
- [Method Leaderboard](/leaderboard) — live benchmark scores