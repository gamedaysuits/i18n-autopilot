---
sidebar_position: 4
title: "Methode-interface"
---
# Gedeelde Methode-interface

De eval harness en i18n-rosetta delen een gemeenschappelijk concept van een **vertaalmethode**. Een methode is elke procedure die een brontekst als invoer neemt en een vertaalde tekst produceert — of het nu gaat om een directe LLM-aanroep, een multi-stage pipeline, een third-party API of een menselijke vertaler.

## Architectuur

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Twee Systemen, Eén Interface

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Taal** | Python | Node.js |
| **Toegangspunt** | `translate.py` | `translate.js` |
| **Interface** | `TranslationProcess`-protocol | `methodPlugin`-configuratie |
| **Doel** | Batch-evaluatie met scoring | Live lokalisatie in dev/CI |
| **Uitvoer** | Run card met metrics | Vertaalde locale-bestanden |

Een methode die beide systemen ondersteunt, biedt twee toegangspunten — één voor elke language runtime. De **method card** vormt de brug: deze beschrijft de methode in een formaat dat beide systemen begrijpen.

## Method Card

Een method card beschrijft *wat* een vertaalmethode is, zonder bedrijfseigen details zoals de volledige system prompt prijs te geven. Deze beantwoordt de volgende vragen:

- Tot welke methodeklasse behoort dit? (raw LLM, coached LLM, pipeline, API, enz.)
- Welke tools worden er gebruikt? (FST-analyzer, dictionary, enz.)
- Is de implementatie open source?
- Welke talenparen worden ondersteund?

Zie de [Method Card Spec](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) voor het volledige JSON-schema.

### Voorbeeld

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

### Methodeklassen

| Klasse | Beschrijving |
|-------|-------------|
| `raw-llm` | Directe LLM-aanroep met minimale instructie |
| `coached-llm` | LLM met gestructureerde prompt, voorbeelden, beperkingen |
| `pipeline` | Multi-stage pipeline met deterministische componenten |
| `custom-plugin` | Extern proces dat het `TranslationProcess`-protocol implementeert |
| `api` | Third-party vertaal-API (Google Translate, DeepL, enz.) |
| `human` | Menselijke vertaling (voor het vaststellen van baselines) |

## Eval Harness: TranslationProcess Protocol

De eval harness maakt gebruik van Python's structural typing (`Protocol`) voor plug-ins. Elke klasse met de juiste method signature werkt — er is geen overerving vereist:

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

Zie het [Plugin Protocol](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) voor de volledige documentatie, inclusief wrapper-voorbeelden voor niet-Python methoden.

## i18n-rosetta: methodPlugin Config

In rosetta worden methoden per talenpaar geregistreerd in `i18n-rosetta.config.json`:

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

Zie de [Plugin Spec](/docs/reference/plugin-spec) voor de interface aan de rosetta-kant.

## Leaderboard-integratie

Wanneer een method card aan een run wordt gekoppeld (via `--method-card`), wordt deze ingesloten in de run card en weergegeven op het leaderboard:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

Het leaderboard toont:
- **Class badge** — visuele indicator (bijv. "pipeline", "coached-llm")
- **Methodenaam** — uit de method card
- **Gebruikte tools** — vermeld in de method card
- **Open source-indicator**

Wanneer er geen method card is gekoppeld, toont het leaderboard de harness-native configuratie (model, conditie, temperatuur, ingeschakelde tools).

:::danger NIET TRAINEN op evaluatiedata
Methoden waarvan het ontwikkelingsproces blootstelling aan de evaluatiedataset omvatte — als trainingsdata, few-shot voorbeelden, dictionary-vermeldingen of prompt tuning-materiaal — worden **gediskwalificeerd** voor het leaderboard. Zie [MT Evaluation](/docs/eval/) voor het onderscheid tussen een goede en een slechte methode.
:::

---

## Zie Ook

- [MT Evaluation](/docs/eval/) — overzicht, leaderboard-waarde en richtlijnen voor goede/slechte methoden
- [Eval Harness](/docs/eval/harness) — hoe u evaluaties uitvoert
- [Evaluation Datasets](/docs/eval/datasets) — beschikbare datasets (EDTeKLA, FLORES+)
- [Run Card Specification](/docs/eval/run-card) — het JSON-schema van de run card
- [Plugin Spec](/docs/reference/plugin-spec) — plug-in-interface aan de rosetta-kant
- [Method Leaderboard](/leaderboard) — live benchmark-scores