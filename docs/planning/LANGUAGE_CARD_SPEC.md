# Language Card Specification

> Internal reference for contributing and extending the language card registry.

## Overview

Every language rosetta supports is defined by a **Language Card** — a JSON file in
`lib/data/language-cards/<code>.json` that contains all metadata the system needs
to translate to that language: formality system, register presets, script info,
method support, and eval dataset links.

## File Structure

```
lib/data/language-cards/
├── ar.json        # Arabic
├── de.json        # German
├── fr.json        # French
├── ja.json        # Japanese
├── ko.json        # Korean
├── ...            # One file per language
└── x-pirate.json  # Conlangs use x- prefix
```

Each file follows the schema at `schemas/language-card.schema.json`.

---

## Adding a New Language

### Step 1: Research the Formality System

Before writing a single line of JSON, study the language. The most common
formality systems are:

| System | Languages | Key Feature |
|--------|-----------|-------------|
| **T-V distinction** | French, German, Spanish, Russian, Czech | Formal/informal second-person pronouns |
| **Speech levels** | Korean | Multiple verb-ending tiers encoding respect |
| **Keigo** | Japanese | Honorific, humble, and polite registers |
| **Particles/pronouns** | Thai, Vietnamese | Politeness particles and pronoun hierarchy |
| **Register levels** | Arabic, Chinese, Indonesian | Vocabulary and syntax complexity |
| **Code-switching** | Filipino, Hindi | Degree of English mixing |
| **None** | Finnish, Turkish, Swahili | No meaningful formal/informal pronoun split |

For the language you're adding, determine:

1. **What system does it use?** (T-V, speech levels, etc.)
2. **What's the default for software UI?** (This becomes the default preset)
3. **What other registers exist?** (At minimum: what do government sites use vs casual apps?)
4. **Are there gendered constructions?** (And what's the inclusive convention?)
5. **Are there script considerations?** (Multiple scripts, direction, converters?)

### Step 2: Write the Language Card

Create `lib/data/language-cards/<code>.json`:

```json
{
  "code": "xx",
  "name": "Language Name",
  "nativeName": "Name in own script",
  "iso639_1": "xx",
  "iso639_3": "xxx",
  "bcp47": "xx",
  "script": "Latn",
  "dir": "ltr",
  "formality": {
    "system": "T-V",
    "description": "Human-readable explanation of the formality system for a developer who doesn't speak this language.",
    "default": "preset-key-for-software-ui"
  },
  "gender": {
    "grammatical": false,
    "inclusiveGuidance": "Guidance for gender-inclusive language, or null."
  },
  "registers": {
    "preset-key": {
      "label": "Display Label",
      "description": "One sentence: when to use this preset.",
      "prompt": "The actual LLM instruction. This steers translation tone.",
      "deeplFormality": "prefer_more"
    }
  },
  "aliases": [],
  "methodSupport": {
    "googleTranslate": true,
    "deepl": false,
    "deeplFormality": false,
    "microsoftTranslator": true,
    "libreTranslate": false,
    "llm": true
  },
  "scriptConverter": null,
  "evalDatasets": [],
  "notes": null
}
```

### Step 3: Validate Against Schema

```bash
# Quick validation with Node
node -e "
  const fs = require('fs');
  const card = JSON.parse(fs.readFileSync('lib/data/language-cards/xx.json'));
  console.log('code:', card.code);
  console.log('registers:', Object.keys(card.registers));
  console.log('default:', card.formality?.default);
  console.log('OK ✓');
"
```

### Step 4: Verify Method Support

Check which translation APIs actually support this language:

| Method | Check URL |
|--------|-----------|
| Google Translate | https://cloud.google.com/translate/docs/languages |
| DeepL | https://www.deepl.com/docs-api/translate-text/ |
| DeepL Formality | Call `GET /v2/languages?type=target` and check `supports_formality` field. Currently: DE, ES, FR, IT, JA, NL, PL, PT, RU, VI. |
| Microsoft Translator | https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support |
| LibreTranslate | https://libretranslate.com/languages |
| LLM | Always `true` (quality varies) |

**DeepL formality mapping**: If `methodSupport.deeplFormality` is `true`, each register preset must also declare a `deeplFormality` field with one of:
- `"prefer_more"` — formal presets (e.g., vouvoiement, 敬語, usted)
- `"prefer_less"` — casual presets (e.g., tutoiement, タメ口, tú)
- `"default"` — neutral presets (e.g., neutral-latam, professional-você)

This field is data-driven: the DeepL method reads it directly from the card instead of pattern-matching on preset key names. If `deeplFormality` is `false` at the language level, omit the field from presets.

### Step 5: Link Eval Datasets

If FLORES+ has test data for this language, add `"flores-plus-devtest"` to the
`evalDatasets` array. Check `test/benchmark/fixtures/` for available language
files.

### Step 6: Test

```bash
# Run the full test suite — the backward compat proxy should pick up the new card
node --test test/*.test.js
```

---

## Writing Good Register Presets

### What Makes a Good Preset

**Good preset prompts:**
- Name the formality feature explicitly (e.g., "해요체", "vous-form", "siz-form")
- Explain the specific pronoun or verb form to use
- Give context for when this register is appropriate
- Mention script considerations if applicable

**Don't** put gender-inclusive guidance in the preset prompt. Gender guidance
belongs in `card.gender.inclusiveGuidance` — it's injected into the LLM
prompt separately by `buildSystemMessage()` so it applies uniformly
regardless of which preset the user chooses.

**Bad preset prompts:**
- `"Professional register."` — too vague, no language-specific guidance
- `"Translate formally."` — what does "formally" mean in this language?
- `"Be polite."` — polite how? Particles? Pronouns? Verb forms?

### Example: Good vs Bad

```
❌ Bad:  "Standard Thai. Professional register."
✔ Good: "Professional Thai. Use คุณ (khun) for second person, เรา (rao)
         for first person when needed. Clear, concise phrasing
         appropriate for digital interfaces."
```

Note: Gender guidance like "Omit gendered politeness particles (ครับ/ค่ะ)"
belongs in `gender.inclusiveGuidance`, not in the register preset prompt.

### Preset Naming Convention

Preset keys should be descriptive and lowercase-hyphenated:

- T-V languages: `formal-vous`, `informal-tu`, `formal-Sie`, `casual-du`
- Speech levels: `polite-haeyo`, `formal-hapsyo`, `casual-hae`
- Neutral: `professional`, `neutral-professional`
- Particles: `neutral-professional`, `polite-male`, `polite-female`

---

## Code Validation Reference

### ISO 639-1 (two-letter)

Used as the primary code for most languages. Check: https://www.loc.gov/standards/iso639-2/php/code_list.php

### ISO 639-3 (three-letter)

Used for languages without ISO 639-1 codes (indigenous, conlangs). Check: https://iso639-3.sil.org/

### BCP 47

The canonical identifier. Usually matches ISO 639-1 but can include region
subtags (e.g., `pt-BR`, `zh-Hant-TW`). Check: https://www.iana.org/assignments/language-subtag-registry

### ISO 15924 (script codes)

Four-letter script code. Common values:

| Code | Script |
|------|--------|
| `Latn` | Latin |
| `Cyrl` | Cyrillic |
| `Arab` | Arabic |
| `Deva` | Devanagari |
| `Beng` | Bengali |
| `Kore` | Korean (Hangul + Han) |
| `Jpan` | Japanese (Hiragana + Katakana + Han) |
| `Hans` | Simplified Chinese |
| `Hant` | Traditional Chinese |
| `Thai` | Thai |
| `Hebr` | Hebrew |
| `Grek` | Greek |

---

## Alias Rules

Aliases are alternative locale codes that resolve to a primary card:

- `no` → `nb` (Norwegian Bokmål — ISO 639-1 `no` maps to Bokmål)
- `iw` → `he` (Hebrew — `iw` is the deprecated Java code)
- `zh-CN` → `zh` (Simplified Chinese — `zh` defaults to Simplified)
- `zh-Hant` → `zh-TW` (Traditional Chinese — `zh-TW` is the primary)
- `fil` → `tl` (Filipino — Google uses `tl`, ISO 639-2 uses `fil`)
- `pt-BR` → `pt` (Brazilian Portuguese — `pt` defaults to Brazilian)

Register aliases in the `aliases` array of the primary card.

---

## PR Checklist

When submitting a new language card:

- [ ] File named `<code>.json` in `lib/data/language-cards/`
- [ ] Passes schema validation (`schemas/language-card.schema.json`)
- [ ] Formality system researched and documented
- [ ] At least one register preset with language-specific prompt
- [ ] Default preset identified and referenced in `formality.default`
- [ ] Method support verified against each API's language list
- [ ] Eval datasets linked if available
- [ ] Gender guidance included if language has grammatical gender
- [ ] Aliases registered if applicable
- [ ] Full test suite passes (`node --test test/*.test.js`)
