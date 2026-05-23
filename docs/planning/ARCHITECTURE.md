# Rosetta Translation Ecosystem — Architecture Guide

> **Version**: 1.1  
> **Purpose**: Explains how the three pieces of the Rosetta translation ecosystem fit together.  
> **Ecosystem status**: i18n-rosetta is the production-ready open-source tool. Rosetta Translate API and the eval harness are internal/planned infrastructure — documented here for architectural context.

---

## The Three Pieces

The Rosetta translation ecosystem is three independent tools that work together
through well-defined contracts. None of them depend on each other at build
time. They communicate through a shared **method plugin format** and a
**REST API contract**.

```
┌───────────────────────┐          ┌────────────────────────┐
│  gds-mt-eval-harness  │          │     Rosetta Translate       │
│  ──────────────────── │          │  ──────────────────────  │
│  Research tool         │          │  Metered API service    │
│  Develops & benchmarks │          │  Hosts IP-protected     │
│  translation methods   │          │  translation pipelines  │
│                        │          │                         │
│  Python / standalone   │          │  Node.js or Python      │
│  [PRIVATE / INTERNAL]  │          │  [PLANNED]              │
└──────────┬────────────┘          └──────────┬─────────────┘
           │                                  │
           │  method.json                     │  REST API
           │  + coaching data                 │  POST /v1/translate
           │  (export)                        │  GET /v1/methods
           │                                  │
           ▼                                  ▼
┌─────────────────────────────────────────────────────────┐
│                     i18n-rosetta                         │
│  ─────────────────────────────────────────────────────── │
│  Open-source developer tool (npm)                        │
│  Translates locale files using pluggable methods         │
│  Zero dependencies · Node.js 20+                         │
│                                                          │
│  Built-in methods:                                       │
│    llm             → OpenRouter / any LLM                │
│    llm-coached     → LLM + grammar/dictionary coaching   │
│    google-translate → Google Cloud Translation API       │
│    api             → Thin pipe to any remote API         │
│                                                          │
│  Plugin system:                                          │
│    .rosetta/methods/<name>/method.json                   │
│    Installed via CLI: rosetta plugin install <path>       │
└─────────────────────────────────────────────────────────┘
```

---

## How They Connect

### 1. Eval Harness → i18n-rosetta (one-way export)

The eval harness is a **research tool**. It develops, tests, and benchmarks
translation methods. When a method reaches acceptable quality, the harness
exports a **method plugin** — a `method.json` manifest and optional coaching
data files.

```
gds-mt-eval-harness              i18n-rosetta
──────────────────               ─────────────
Run benchmarks                   rosetta plugin install ./french-formal-v1/
Export method.json       ────►   Plugin saved to .rosetta/methods/
Include coaching data            Method available for rosetta sync
Include benchmark scores         Benchmarks shown in rosetta status
```

**The harness never runs inside rosetta.** It's a separate tool that produces
static output (JSON files). Rosetta just reads those files.

**Contract**: `docs/METHOD_PLUGIN_SPEC.md`

---

### 2. Rosetta Translate → i18n-rosetta (API at runtime)

Rosetta Translate is a **metered API service**. It hosts proprietary translation
methods server-side — the prompts, coaching data, and linguistic pipelines
never leave the server.

```
i18n-rosetta (client)            Rosetta Translate (server)
─────────────────────            ──────────────────────
rosetta sync                     Receives keys + target locale
  → APIMethod.translate()        Loads coaching data (server-side)
  → POST /v1/translate           Calls LLM (OpenRouter, etc.)
  ← translations + billing       Validates output
  ← meta.cost_usd                Returns translations
```

Rosetta's `APIMethod` (lib/methods/api.js) is a **dumb pipe**. It sends keys
out and receives translations back. It contains zero translation logic and
zero proprietary content.

**Contract**: `docs/planning/TRANSLATE_API_SPEC.md`

---

### 3. Eval Harness → Rosetta Translate (method deployment)

The eval harness also feeds Rosetta Translate. When a proprietary method is
developed and benchmarked, the coaching data and config are deployed to the
Rosetta Translate server — NOT exported to a public plugin.

```
gds-mt-eval-harness              Rosetta Translate
──────────────────               ──────────────
Develop method                   Deploy to methods/ directory
Benchmark method         ────►   Register in methods table
Verify quality metrics           Available via GET /v1/methods
                                 Callable via POST /v1/translate
```

The key difference from the i18n-rosetta export path:

| | Open Plugin (→ rosetta) | Proprietary (→ Rosetta Translate) |
|---|---|---|
| Coaching data location | Bundled in plugin directory | Server-side only |
| Method type in rosetta | `llm-coached` | `api` |
| User sees prompts? | Yes | No |
| Pricing | Free | Metered |
| IP protection | None (open source) | Full (server-side) |

---

## The Plugin Format (Shared Contract)

The `method.json` manifest is the universal interchange format. The eval
harness produces it, rosetta consumes it, and Rosetta Translate's `/methods/:name`
endpoint returns it.

```json
{
  "name": "french-formal-v1",
  "type": "llm-coached",
  "version": "1.0.0",
  "description": "Formally-tuned French with terminology enforcement",
  "locales": ["fr"],
  "config": {
    "model": "google/gemini-3.5-flash",
    "register": "formal",
    "batchSize": 30
  },
  "benchmarks": {
    "fr": {
      "corpus_chrf": 72.3,
      "exact_match_rate": 0.42,
      "corpus_size": 500,
      "date": "2026-05-11T00:00:00Z",
      "harness_version": "1.0.0"
    }
  },
  "provenance": {
    "resources": [],
    "commercialReady": false,
    "flags": ["license-unclear"]
  }
}
```

**Full spec**: `docs/METHOD_PLUGIN_SPEC.md`

---

## What Each Piece Knows About the Others

| Tool | Knows about rosetta? | Knows about Rosetta Translate? | Knows about harness? |
|---|---|---|---|
| **i18n-rosetta** | (is rosetta) | Yes — `api` method calls it | No — just reads plugin exports |
| **Rosetta Translate** | Yes — serves its requests | (is Rosetta Translate) | No — receives deployed methods |
| **Eval Harness** | Yes — exports plugin format | No — methods deployed separately | (is the harness) |

---

## User Scenarios

### Scenario 1: Free, zero-config (most users)

```bash
export OPENROUTER_API_KEY=sk-...
npx i18n-rosetta sync
```
- Uses built-in `llm` method
- No plugins, no Rosetta Translate, no harness

### Scenario 2: Google Translate baseline

```bash
export GOOGLE_TRANSLATE_API_KEY=AIza...
npx i18n-rosetta sync
```
- Uses built-in `google-translate` method
- No plugins needed

### Scenario 3: Premium server-side translations

```bash
export ROSETTA_TRANSLATE_API_KEY=rosetta_sk_live_...
rosetta plugin install crk-coached-v1      # installs API manifest
rosetta sync                                # routes crk keys through Rosetta Translate
```
- Plugin manifest has `type: "api"` → rosetta uses `APIMethod`
- All IP stays on the Rosetta Translate server

### Scenario 4: Open plugin with bundled coaching

```bash
rosetta plugin install ./french-formal-v1/  # from harness export
rosetta sync                                # uses llm-coached with bundled data
```
- Plugin has `type: "llm-coached"` → rosetta uses user's own OpenRouter key
- Coaching data is local (no server call)

### Scenario 5: DIY coaching (no plugin, no harness)

```json
// i18n-rosetta.config.json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "llm-coached" }
  }
}
```
```
.rosetta/coaching/fr.json   ← user writes their own coaching data
```
- No plugin, no harness, no Rosetta Translate
- User maintains their own grammar rules and dictionary

---

## Language Card Architecture

Every language rosetta supports is defined by a **Language Card** — a JSON file
in `lib/data/language-cards/<code>.json` loaded at startup by `lib/registers.js`.

```
lib/data/language-cards/
├── fr.json        # French — T-V distinction (vous/tu)
├── ko.json        # Korean — speech levels (해요체/합쇼체/해체)
├── ja.json        # Japanese — keigo (丁寧語/尊敬語/謙譲語)
├── th.json        # Thai — particles & pronouns (ครับ/ค่ะ)
├── hi.json        # Hindi — T-V + code-switching (Hinglish)
├── crk.json       # Plains Cree — register levels + SRO/syllabics
└── x-pirate.json  # Conlangs use x- prefix
```

### What's in a Card

| Field | Purpose |
|-------|---------|
| `formality.system` | The formality system name (T-V, speech-levels, keigo, particles, etc.) |
| `formality.default` | Default preset key for software UI |
| `registers` | Named presets with label, description, and LLM prompt text |
| `gender` | Grammatical gender rules and inclusive writing guidance |
| `methodSupport` | Which APIs support this language + DeepL formality flag |
| `scriptConverter` | Reference to deterministic script converter (scripts.js) |
| `aliases` | Alternative locale codes (e.g., `no` → `nb`, `iw` → `he`) |

### Accessor API

`lib/registers.js` exposes a structured API. All language data flows through
these functions — no direct card access outside this module:

```
getLanguageCard(code)       → full card with alias resolution
getRegister(code, preset)   → register prompt text (preset key or custom passthrough)
getRegisterPresets(code)    → preset list for the init wizard
getFormality(code, preset)  → structured formality metadata for method integration
getGenderGuidance(code)     → language-specific inclusive writing guidance
getMethodSupport(code)      → which APIs support this language
getAllLanguageCodes()        → all codes with language cards
resolveCode(code)           → alias + base-locale resolution
```

The legacy `DEFAULT_REGISTERS` export is a `Proxy` that dynamically builds the
old `{ name, register, dir?, scripts? }` shape from card data. This preserves
backward compatibility while all consumers migrate to the structured API.

### How Cards Connect to the Rest

```
Language Card (.json)
       │
       ├── registers.js (accessor layer)
       │     ├── config.js        → resolves preset keys to prompt text
       │     ├── pairs.js         → adds formalitySystem, genderGuidance, dir, scripts
       │     ├── init.js          → guided preset picker in the setup wizard
       │     └── status.js        → structured register display
       │
       ├── pairs.js → llm.js     → buildSystemMessage() injects genderGuidance into prompt
       │
       ├── deepl.js              → reads card directly for deeplFormality on presets
       │
       ├── run-benchmark.js      → mirrors production prompt (register + gender guidance)
       │
       └── schemas/language-card.schema.json (validation)
```

**Note on DeepL:** `lib/methods/deepl.js` calls `getLanguageCard()` and reads
`card.registers[preset].deeplFormality` directly rather than going through a
dedicated accessor. This is by design — the DeepL formality mapping is tightly
coupled to the preset, so direct card access is cleaner than adding another
accessor for a single consumer.

**Adding a new language**: See `docs/planning/LANGUAGE_CARD_SPEC.md` for the
full research and contribution process.

---

## Design Principles

1. **No circular dependencies.** The bridges are one-way. The harness exports
   to rosetta; rosetta calls Rosetta Translate. Neither calls back.

2. **Rosetta is the lightweight core.** Zero dependencies, config-optional,
   works out of the box. Plugins and API are additive.

3. **IP protection is architectural.** Proprietary techniques stay server-side
   in Rosetta Translate. The npm package ships nothing proprietary.

4. **The plugin format is the contract.** Everything flows through `method.json`.
   If the harness can produce it and rosetta can read it, the system works.

5. **Each tool has one job:**
   - Harness → develop and validate translation methods
   - Rosetta Translate → host and meter premium translations
   - Rosetta → translate locale files using whatever method is configured

6. **Language metadata is data, not code.** Register presets, formality systems,
   and method support are defined in JSON cards — not hardcoded in switch
   statements. Contributors can add a language without touching any JS.

