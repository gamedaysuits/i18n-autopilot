---
sidebar_position: 5
title: "Datos ng Coaching"
---
# Coaching Data

Ang coaching data ay ang mekanismo ng rosetta para turuan ang mga LLM tungkol sa mga wikang hindi kasama sa kanilang pagsasanay. Sa pamamagitan ng pagbibigay ng mga panuntunan sa gramatika, mga diksyunaryo, at mga tala sa istilo kasama ng bawat kahilingan sa pagsasalin, binabago mo ang isang general-purpose na LLM upang maging isang context-aware na tagasalin para sa anumang wika — kabilang ang mga wikang may zero na umiiral na suporta sa MT.

## Paano Ito Gumagana

Kapag itinakda mo ang method ng isang pares sa `llm-coached`, naglo-load ang rosetta ng isang coaching file mula sa `.rosetta/coaching/<locale>.json` at inilalagay ang mga nilalaman nito sa bawat LLM prompt bilang bahagi ng system message. Nakikita ng LLM ang iyong mga panuntunang linggwistiko kasama ng kahilingan sa pagsasalin, na gumagawa ng output na sumusunod sa iyong gramatika at terminolohiya sa halip na manghula.

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

Dahil ang coaching data ay bahagi ng system message, nakikinabang ito sa **prompt caching** — ang mga provider tulad ng Anthropic at Google ay nagka-cache ng mga inuulit na system prefix, kaya minsan ka lang magbabayad para sa coaching context bawat session, hindi bawat batch.

## Format ng Coaching File

Gumawa ng isang JSON file bawat locale sa `.rosetta/coaching/`:

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

### Mga Field

| Field | Type | Required | Paglalarawan |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Hindi | Array ng mga panuntunan sa gramatika na inilagay sa system prompt. Ang bawat panuntunan ay dapat na isang maikli at naaaksyunan na tagubilin na maaaring sundin ng LLM. |
| `dictionary` | `object` | Hindi | Key-value map ng terminong Ingles → termino sa target na wika. Ginagamit para sa domain-specific na bokabularyo na hindi malalaman ng LLM. |
| `style_notes` | `string` | Hindi | Free-form na mga tagubilin sa istilo (register, tono, mga kumbensyon sa pormalidad). |

Ang lahat ng mga field ay opsyonal — maaari kang magsimula sa isang diksyunaryo lamang at magdagdag ng mga panuntunan sa gramatika habang ikaw ay nagpapabuti.

## Fallback Behavior

Kung ang isang pares ay naka-configure para sa `llm-coached` ngunit walang umiiral na coaching file para sa locale na iyon, ang rosetta ay **babalik sa karaniwang `llm` method** na may kasamang babala sa console:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Nangangahulugan ito na maaari mong ligtas na itakda ang `"defaultMethod": "llm-coached"` nang globally — gagamitin ito ng mga wikang may coaching data, at ang iba ay makakakuha ng karaniwang LLM translation nang walang mga error.

## Kailan Gagamitin ang Coaching

| Senaryo | Inirerekomendang Method |
|----------|-------------------|
| Mga Tier 1 na wika (French, Spanish, German) | `llm` o `google-translate` — alam na alam na ito ng mga LLM |
| Mga Tier 2 na wika (Korean, Turkish, Thai) | `llm` na may register — sapat na pinangangasiwaan ito ng mga LLM na may gabay sa istilo |
| Mga Tier 3 na wika (Plains Cree, Yoruba, Quechua) | `llm-coached` — kailangan ng mga LLM ng mga panuntunan sa gramatika at mga diksyunaryo |
| Mga Conlang (Klingon, Sindarin, Kryptonian) | `llm-coached` — may ilang training data ang mga LLM ngunit nangangailangan ng mga pagwawasto |

## Pagbuo ng Mahusay na Coaching Data

### Mga Panuntunan sa Gramatika

Isulat ang mga panuntunan bilang **mga tagubilin**, hindi mga paglalarawan. Mas sinusunod ng LLM ang mga tagubilin kaysa sa pag-interpret nito ng teoryang linggwistiko.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Mga Diksyunaryo

Magtuon sa **mga domain-specific na termino** na maaaring magkamali o maimbento ng LLM. Huwag nang abalahin ang mga karaniwang salita na pinangangasiwaan na ng LLM — magtuon sa mga terminong partikular sa UI ng iyong application.

### Mga Tala sa Istilo

Maging tiyak tungkol sa register, pormalidad, at mga kumbensyon:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Pag-test ng mga Coached Translation

Gamitin ang [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) upang i-benchmark ang iyong mga coached translation laban sa isang reference corpus:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Nagbibigay ito sa iyo ng mga score para sa chrF++, BLEU, at exact match. Gumawa ng maraming bersyon ng coaching file at ihambing — mas maganda ang mga objective metric kaysa sa subjective na pagsusuri.

## Tingnan Din

- [Mga Low-Resource na Wika](/docs/guides/low-resource-languages) — buong walkthrough para sa pagbuo ng isang translation pipeline mula sa simula
- [Mga Method ng Pagsasalin](/docs/guides/translation-methods) — paghahambing ng lahat ng available na method
- [Bumuo ng Plugin](/docs/tutorials/build-a-plugin) — i-package ang isang coached method bilang isang magagamit muli na plugin