---
sidebar_position: 6
title: "Mga Script Converter"
---
# Script Converters

Ang mga script converter ay deterministic at LLM-free na mga post-translation hook na nagko-convert ng text mula sa isang writing system papunta sa iba. Ine-enable ng mga ito ang isang "translate once, render in multiple scripts" na workflow — magta-translate ka sa isang working script (karaniwang Latin), tapos automatic itong iko-convert sa display script.

## Bakit Script Converters?

May mga language na gumagamit ng multiple scripts para sa iisang spoken language:

- **Plains Cree**: SRO (Latin) para sa editing → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) para sa display
- **Serbian**: Latin para sa international use → Cyrillic para sa domestic use
- **Klingon**: Romanization para sa typing → pIqaD (  ) para sa display

Ang pag-translate nang direkta sa mga non-Latin script ay nagdudulot ng mga problema: nagha-hallucinate ng characters ang mga LLM, nagiging mahirap i-version-control ang mga JSON file, at hindi ma-compare ng mga diff tool ang mga changes. Sinosolve ito ng mga script converter sa pamamagitan ng pag-keep ng mga translation sa isang version-control-friendly na script at pag-convert nang deterministic during sync time.

## Mga Available na Converter

May kasamang five built-in script converters ang Rosetta:

| Locale | From | To | Type | Font Required? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Deterministic | Hindi — native Unicode |
| `sr` | Latin | Cyrillic | Deterministic | Hindi — native Unicode |
| `tlh` | Romanization | pIqaD | Deterministic | Oo — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latin | Tengwar (Mode of Beleriand) | Deterministic | Oo — PUA U+E000–E07F |
| `x-kryptonian` | Latin | Kryptonian | Font-based cipher | Oo — PUA U+E100–E119 |

### Deterministic vs. Font-Based

- Ang mga **deterministic converter** (Cree, Serbian, Klingon, Tengwar) ay nagpe-perform ng totoong character-to-character mapping gamit ang mga linguistic rule. Ang output ay naglalaman ng mga actual na Unicode character.
- Ang mga **font-based converter** (Kryptonian) ay mga 1:1 substitution cipher kung saan ang output ay mga Unicode PUA character na magre-render lang nang tama kapag may naka-load na specific na font.

## Paano Sila Gumagana

Nagra-run ang mga script converter **after** ng translation bilang isang post-processing step. Ang pipeline ay:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Halimbawa po sa Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Greedy Left-to-Right Matching

Pare-pareho ang algorithm na ginagamit ng lahat ng converter: sa bawat character position, ita-try muna ang longest possible match, tapos progressively shorter matches. Ang mga character na hindi nagma-match sa anumang pattern (spaces, punctuation, numbers) ay magpa-pass through nang walang pagbabago.

Hina-handle nito nang tama ang mga digraph at trigraph:
- Klingon: `tlh` → single pIqaD character (hindi `t` + `l` + `h`)
- Serbian: `nj` → `њ` (hindi `н` + `ј`)
- Cree: `twê` → single syllabic (hindi `t` + `w` + `ê`)

## Paggamit ng mga Script Converter

Automatic na nag-a-activate ang mga script converter kapag nag-match ang locale code sa isang registered converter. No configuration needed po — i-set lang ang inyong target locale:

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

Kapag nag-sync ang rosetta sa `en:crk` pair, ang mga translation ay ipo-produce muna sa SRO, tapos automatic na iko-convert sa Syllabics bago i-write sa `crk.json`.

### Pag-check ng Converter Status

```bash
npx i18n-rosetta status
```

Ipinapakita ng status output kung aling mga pair ang may active na script converters at kung anong conversion ang ginagawa nila.

## Mga Web Font Requirement

Tatlong converter ang nag-o-output ng mga Unicode Private Use Area (PUA) character na nangangailangan ng mga custom web font:

### Klingon (pIqaD)

Mag-install ng CSUR-compatible na pIqaD font (hal., "pIqaD qolqoS" o "Klingon pIqaD HaSta"):

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

Mag-install ng CSUR-compatible na Tengwar font (hal., "Tengwar Formal CSUR", "Tengwar Annatar"):

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

Mag-install ng Kryptonian font na naka-map sa mga PUA codepoint na U+E100–E119:

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

:::tip Alternative approach para sa Kryptonian
Dahil ang Kryptonian ay isang pure A-Z cipher, pwede niyo na pong i-skip ang script converter entirely at i-apply na lang ang font sa Latin text via CSS. Madalas ay mas simple ito para sa mga web deployment — i-serve lang ang Kryptonian font at i-set ang `font-family` sa mga relevant element.
:::

## Pag-add ng Custom Converter

Para mag-add ng converter para sa isang bagong language, i-edit po ang `lib/scripts.js`:

1. **I-create ang conversion map** — isang ordered array ng mga `[from, to]` pair, unahin ang mga longest sequence
2. **I-create ang converter function** — isang greedy left-to-right scanner (gamitin ang `sroToSyllabics` bilang template)
3. **I-register ito** sa `SCRIPT_CONVERTERS` object gamit ang locale code bilang key
4. **I-add ang `script` field** sa register entry ng language sa `registers.js`

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

## Tingnan Din

- [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) — PUA fonts, Unicode, pag-add ng mga bagong converter
- [Quality Gate](/docs/concepts/quality-gate) — validation na nagra-run bago ang script conversion
- [Supported Languages](/docs/reference/supported-languages) — kung aling mga language ang may mga script converter
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — SRO→Syllabics in context
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — script conversion sa isang multi-stage pipeline