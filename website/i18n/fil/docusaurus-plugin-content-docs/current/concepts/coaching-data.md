---
sidebar_position: 5
title: "Coaching Data"
---
# Coaching Data

Ang coaching data ay ang mechanism ng rosetta para turuan ang mga LLMs tungkol sa mga languages na hindi sila na-train. Sa pamamagitan ng pag-provide ng grammar rules, dictionaries, at style notes kasama ng bawat translation request, nata-transform ninyo ang isang general-purpose LLM into a context-aware translator para sa kahit anong language — kasama na ang mga languages na may zero existing MT support.

## Paano Ito Gumagana

Kapag sinet ninyo ang method ng isang pair sa `llm-coached`, maglo-load ang rosetta ng coaching file mula sa `.rosetta/coaching/<locale>.json` at i-i-inject ang contents nito sa bawat LLM prompt bilang part ng system message. Makikita ng LLM ang inyong linguistic rules kasama ng translation request, kaya nagpo-produce ito ng output na sumusunod sa inyong grammar at terminology sa halip na manghula.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Dahil part ng system message ang coaching data, nagbe-benefit ito mula sa **prompt caching** — ang mga providers tulad ng Anthropic at Google ay nagka-cache ng repeated system prefixes, kaya magbabayad lang kayo para sa coaching context once per session, hindi once per batch.

## Coaching File Format

Gumawa po ng isang JSON file per locale sa `.rosetta/coaching/`:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Hindi | Array ng grammar rules na in-inject sa system prompt. Ang bawat rule ay dapat concise at actionable instruction na kayang i-follow ng LLM. |
| `dictionary` | `object` | Hindi | Key-value map ng English term → target language term. Ginagamit para sa domain-specific vocabulary na hindi alam ng LLM. |
| `style_notes` | `string` | Hindi | Free-form style instructions (register, tone, formality conventions). |

Optional ang lahat ng fields — pwede po kayong mag-start sa dictionary lang at mag-add ng grammar rules habang nagre-refine kayo.

## Fallback Behavior

Kung ang isang pair ay naka-configure para sa `llm-coached` pero walang nag-e-exist na coaching file para sa locale na iyon, ang rosetta ay **magfo-fall back sa standard `llm` method** na may kasamang console warning:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Ibig sabihin nito, pwede ninyong i-safely set ang `"defaultMethod": "llm-coached"` globally — gagamitin ito ng mga languages na may coaching data, at ang iba ay makakakuha ng standard LLM translation nang walang errors.

## Kailan Dapat Gamitin ang Coaching

| Scenario | Recommended Method |
|----------|-------------------|
| Tier 1 languages (French, Spanish, German) | `llm` o `google-translate` — alam na alam na ito ng mga LLMs |
| Tier 2 languages (Korean, Turkish, Thai) | `llm` na may register — naha-handle ito nang maayos ng mga LLMs kapag may style guidance |
| Tier 3 languages (Plains Cree, Yoruba, Quechua) | `llm-coached` — kailangan ng mga LLMs ng grammar rules at dictionaries |
| Conlangs (Klingon, Sindarin, Kryptonian) | `llm-coached` — may ilang training data ang mga LLMs pero kailangan ng corrections |

## Pagbuo ng Magandang Coaching Data

### Grammar Rules

Isulat ang mga rules bilang **instructions**, hindi descriptions. Mas nasusunod ng LLM ang mga instructions kaysa sa pag-interpret nito ng linguistic theory.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Dictionaries

Mag-focus sa **domain-specific terms** na posibleng magkamali o maimbento ng LLM. Huwag na pong isama ang mga common words na naha-handle na ng LLM — mag-focus sa mga terms na specific sa UI ng inyong application.

### Style Notes

Maging specific tungkol sa register, formality, at conventions:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Pag-test ng mga Coached Translations

Gamitin ang [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) para i-benchmark ang inyong mga coached translations laban sa isang reference corpus:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Magbibigay ito sa inyo ng chrF++, BLEU, at exact match scores. Gumawa po ng multiple coaching file versions at i-compare — mas maganda ang objective metrics kaysa sa subjective review.

---

## Tingnan Din

- [Translation Methods](/docs/guides/translation-methods) — ang llm-coached method
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — coaching in practice
- [Plugin Specification](/docs/reference/plugin-spec) — pag-package ng coaching data sa isang plugin
- [Quality Gate](/docs/concepts/quality-gate) — kung paano vina-validate ang mga coached translations
- [Configuration](/docs/getting-started/configuration) — per-pair coaching config