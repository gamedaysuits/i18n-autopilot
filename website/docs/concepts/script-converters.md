---
sidebar_position: 6
title: Script Converters
---

# Script Converters

Script converters are deterministic, LLM-free post-translation hooks that convert text from one writing system to another. They enable a "translate once, render in multiple scripts" workflow — you translate into a working script (typically Latin), then convert to the display script automatically.

## Why Script Converters?

Some languages use multiple scripts for the same spoken language:

- **Plains Cree**: SRO (Latin) for editing → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) for display
- **Serbian**: Latin for international use → Cyrillic for domestic use
- **Klingon**: Romanization for typing → pIqaD (  ) for display

Translating directly into non-Latin scripts creates problems: LLMs hallucinate characters, JSON files become hard to version-control, and diff tools can't compare changes. Script converters solve this by keeping translations in a version-control-friendly script and converting deterministically at sync time.

## Available Converters

Rosetta ships with five built-in script converters:

| Locale | From | To | Type | Font Required? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Deterministic | No — native Unicode |
| `sr` | Latin | Cyrillic | Deterministic | No — native Unicode |
| `tlh` | Romanization | pIqaD | Deterministic | Yes — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latin | Tengwar (Mode of Beleriand) | Deterministic | Yes — PUA U+E000–E07F |
| `x-kryptonian` | Latin | Kryptonian | Font-based cipher | Yes — PUA U+E100–E119 |

### Deterministic vs. Font-Based

- **Deterministic converters** (Cree, Serbian, Klingon, Tengwar) perform real character-to-character mapping using linguistic rules. The output contains actual Unicode characters.
- **Font-based converters** (Kryptonian) are 1:1 substitution ciphers where the output is Unicode PUA characters that only render correctly with a specific font loaded.

## How They Work

Script converters run **after** translation as a post-processing step. The pipeline is:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

For example, Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Greedy Left-to-Right Matching

All converters use the same algorithm: at each character position, try the longest possible match first, then progressively shorter matches. Characters that don't match any pattern (spaces, punctuation, numbers) pass through unchanged.

This handles digraphs and trigraphs correctly:
- Klingon: `tlh` → single pIqaD character (not `t` + `l` + `h`)
- Serbian: `nj` → `њ` (not `н` + `ј`)
- Cree: `twê` → single syllabic (not `t` + `w` + `ê`)

## Using Script Converters

Script converters activate automatically when the locale code matches a registered converter. No configuration needed — just set your target locale:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

When rosetta syncs the `en:crk` pair, translations are first produced in SRO, then automatically converted to Syllabics before writing to `crk.json`.

### Checking Converter Status

```bash
npx i18n-rosetta status
```

The status output shows which pairs have active script converters and what conversion they perform.

## Web Font Requirements

Three converters output Unicode Private Use Area (PUA) characters that require custom web fonts:

### Klingon (pIqaD)

Install a CSUR-compatible pIqaD font (e.g., "pIqaD qolqoS" or "Klingon pIqaD HaSta"):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

Install a CSUR-compatible Tengwar font (e.g., "Tengwar Formal CSUR", "Tengwar Annatar"):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

Install a Kryptonian font mapped to PUA codepoints U+E100–E119:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Alternative approach for Kryptonian
Since Kryptonian is a pure A-Z cipher, you can skip the script converter entirely and apply the font to Latin text via CSS. This is often simpler for web deployments — just serve the Kryptonian font and set `font-family` on the relevant elements.
:::

## Adding a Custom Converter

To add a converter for a new language, edit `lib/scripts.js`:

1. **Create the conversion map** — an ordered array of `[from, to]` pairs, longest sequences first
2. **Create the converter function** — a greedy left-to-right scanner (use `sroToSyllabics` as a template)
3. **Register it** in the `SCRIPT_CONVERTERS` object with the locale code as key
4. **Add the `script` field** to the language's register entry in `registers.js`

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## See Also

- [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) — PUA fonts, Unicode, adding new converters
- [Quality Gate](/docs/concepts/quality-gate) — validation that runs before script conversion
- [Supported Languages](/docs/reference/supported-languages) — which languages have script converters
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — SRO→Syllabics in context
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — script conversion in a multi-stage pipeline
