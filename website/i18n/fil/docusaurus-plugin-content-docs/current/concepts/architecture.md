---
sidebar_position: 1
title: "Architecture"
---
# Architecture

Ang Rosetta translation ecosystem ay binubuo ng tatlong independent tools na nagtutulungan through well-defined contracts. Wala sa kanila ang naka-depend sa isa't isa at build time. Nag-co-communicate sila through a shared **method plugin format** at isang **REST API contract**.

## Ang Tatlong Components

```mermaid
graph TB
    subgraph Research["Eval Harness (Research)"]
        H["gds-mt-eval-harness\nPython / standalone"]
    end
    subgraph Production["i18n-rosetta (Developer Tool)"]
        R["i18n-rosetta\nNode.js / npm\nZero dependencies"]
    end
    subgraph Service["Rosetta Translate (Planned)"]
        T["Metered API service\nHosts IP-protected methods"]
    end
    H -->|"method.json\n+ coaching data"| R
    T -->|"REST API\nPOST /v1/translate"| R
    H -->|"Deploy methods"| T
```

### i18n-rosetta (ang project na ito)

Ang open-source developer tool. Nagta-translate ito ng locale files gamit ang pluggable methods. Zero dependencies, config-optional, at works out of the box.

**Built-in methods:**
- `llm` → OpenRouter / any LLM (200+ models)
- `llm-coached` → LLM + grammar/dictionary coaching
- `openai` → Direct OpenAI API (GPT-4o, GPT-4o-mini)
- `anthropic` → Direct Anthropic API (Claude Sonnet, Haiku, Opus)
- `gemini` → Direct Google Gemini API (Flash, Pro — may free tier)
- `google-translate` → Google Cloud Translation API v2
- `deepl` → DeepL API na may glossary support
- `microsoft-translator` → Azure Cognitive Services Translator
- `libretranslate` → Self-hosted LibreTranslate (AGPL, libre)
- `api` → Thin pipe papunta sa kahit anong remote REST endpoint

### Eval Harness (companion project)

Isang research tool para sa pag-develop, pag-test, at pag-benchmark ng translation methods. Kapag umabot na sa acceptable quality ang isang method, mag-e-export ang harness ng isang **method plugin** — isang `method.json` manifest at optional na coaching data files.

Hindi kailanman nagra-run ang harness sa loob ng rosetta. Isa itong separate tool na nagpo-produce ng static output (JSON files). Binabasa lang ng Rosetta ang mga files na ito.

[→ Eval Harness sa GitHub](https://github.com/gamedaysuits/gds-mt-eval-harness)

### Rosetta Translate (planned)

Isang metered API service na nagho-host ng proprietary translation methods sa server-side — ang mga prompts, coaching data, at linguistic pipelines ay hindi kailanman lumalabas ng server.

## Paano Sila Naka-connect

### Eval Harness → i18n-rosetta (one-way export)

```mermaid
flowchart LR
    A["Run benchmarks"] --> B["Export method.json"]
    B --> C["rosetta plugin install"]
    C --> D["Plugin saved to\n.rosetta/methods/"]
    D --> E["rosetta sync"]
```

**Contract**: [Plugin Specification](/docs/reference/plugin-spec)

### Rosetta Translate → i18n-rosetta (API at runtime)

```mermaid
flowchart LR
    A["rosetta sync"] --> B["APIMethod.translate()"]
    B --> C["POST /v1/translate"]
    C --> D["Server loads coaching data"]
    D --> E["Server calls LLM"]
    E --> F["Returns translations"]
```

Ang `APIMethod` ng Rosetta ay isang **dumb pipe**. Nagse-send ito ng keys palabas at tumatanggap ng translations pabalik. Wala itong kahit anong translation logic at zero proprietary content.

## Ano Ang Alam Ng Bawat Component Sa Isa't Isa

| Tool | Alam ang rosetta? | Alam ang Rosetta Translate? | Alam ang harness? |
|------|---------------------|-------------------------------|---------------------|
| **i18n-rosetta** | *(ito ang rosetta)* | Oo — tinatawag ito ng `api` method | Hindi — nagbabasa lang ng plugin exports |
| **Rosetta Translate** | Oo — nagse-serve ng requests nito | *(ito ang Rosetta Translate)* | Hindi — tumatanggap ng deployed methods |
| **Eval Harness** | Oo — nag-e-export ng plugin format | Hindi — hiwalay na naka-deploy ang methods | *(ito ang harness)* |

## User Scenarios

### Scenario 1: Libre, zero-config (karamihan ng users)

```bash
export OPENROUTER_API_KEY=sk-...
npx i18n-rosetta sync
```

Gumagamit ng built-in na `llm` method. Walang plugins, walang Rosetta Translate, walang harness.

### Scenario 2: Google Translate baseline

```bash
export GOOGLE_TRANSLATE_API_KEY=AIza...
npx i18n-rosetta sync
```

Gumagamit ng built-in na `google-translate` method. Hindi kailangan ng plugins.

### Scenario 3: Open plugin na may bundled coaching

```bash
rosetta plugin install ./french-formal-v1/
rosetta sync
```

May `type: "llm-coached"` ang plugin → ginagamit ng rosetta ang sariling OpenRouter key ng user. Local ang coaching data (walang server call).

### Scenario 4: DIY coaching (walang plugin, walang harness)

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": { "method": "llm-coached" }
  }
}
```

Mina-maintain ng user ang sarili nilang grammar rules at dictionary sa `.rosetta/coaching/fr.json`.

## Design Principles

1. **Walang circular dependencies.** One-way lang ang mga bridges.
2. **Ang Rosetta ang lightweight core.** Zero dependencies, config-optional. Additive ang mga plugins at API.
3. **Architectural ang IP protection.** Nananatili sa server-side ang proprietary techniques. Walang shini-ship na proprietary ang npm package.
4. **Ang plugin format ang contract.** Dumadaan ang lahat sa `method.json`.
5. **May iisang trabaho ang bawat tool.** Harness → mag-develop ng methods. Rosetta Translate → mag-host ng methods. Rosetta → mag-translate ng files.

---

## See Also

- [Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat built-in method
- [Plugin Specification](/docs/reference/plugin-spec) — ang method.json manifest format
- [Eval Harness](/docs/eval/harness) — ang companion research tool
- [Serving a Method via API](/docs/guides/serving-a-method) — pag-host ng custom translation pipelines
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — ang use case na nag-drive sa architecture na ito