---
sidebar_position: 3
title: "Conlangs, Scripts, at Orthography"
---
# Conlangs, Scripts & Orthography

May first-class support ang rosetta para sa mga constructed languages (conlangs) via LLM registers at deterministic script converters. Iko-cover ng guide na ito kung paano gumagana ang conlang support, anong mga fonts ang kailangan niyo, at kung paano mag-add ng sarili ninyong conlang.

:::tip Bakit mahalaga ang mga conlangs
Hindi lang novelty ang mga conlangs — ginagamit nila ang exact same infrastructure na ginagamit para sa mga totoong underserved languages. Ang quality gate, coaching system, at script conversion pipeline ay nagwo-work identically para sa Klingon at Plains Cree. Kung gumagana ang inyong conlang pipeline, gagana rin po ang inyong low-resource language pipeline.
:::

---

## Mga Supported na Constructed Languages

| Language | Code | Script Converter | Font Required |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanization → pIqaD | PUA font (e.g., pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ Latin → Tengwar | CSUR PUA font |
| Kryptonian | `x-kryptonian` | ✅ Latin → Kryptonian | PUA font |
| Pirate English | `x-pirate` | ❌ register only | Wala |
| Shakespearean English | `x-shakespeare` | ❌ register only | Wala |
| Yoda-speak | `x-yoda` | ❌ register only | Wala |

Gumagamit ang mga conlang codes ng `x-` prefix ayon sa BCP-47 private-use convention, maliban sa Klingon (`tlh`) na may naka-assign na [ISO 639-3](https://iso639-3.sil.org/code/tlh) code mula sa SIL International.

---

## Unicode, PUA, at Font Requirements

### Ang Private Use Area

Ang Klingon (pIqaD), Sindarin (Tengwar), at Kryptonian ay gumagamit ng mga Unicode **Private Use Area (PUA)** characters. Ang PUA ay ang range na U+E000–U+F8FF — ang mga codepoints na ito ay **walang standard assignment**. Minemaintain ng [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) ang mga community-agreed mappings para sa mga fictional scripts, pero hindi po ito part ng Unicode standard.

Ang ibig sabihin nito in practice:

- Magre-render ang PUA text bilang mga **empty boxes** (□□□) kapag walang naka-load na tamang font
- Pwedeng mag-map ang iba't ibang fonts ng magkakaibang glyphs sa parehong PUA codepoints
- HINDI naka-bundle sa rosetta ang mga PUA fonts — kailangan niyo po itong i-load mismo
- Hindi kailanman ire-render ng mga system fonts ang mga characters na ito

### Mga PUA Ranges per Script

| Script | PUA Range | CSUR Reference |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | Nag-iiba per font | Walang CSUR standard |

### Pag-load ng mga PUA Web Fonts

Para ma-display ang PUA-based conlang text sa inyong web application, i-load ang tamang font via CSS:

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning HINDI guaranteed ang Unicode support
[Explicitly declined](https://www.unicode.org/faq/private_use.html) ng Unicode Consortium na i-encode ang mga fictional scripts sa standard. Ang mga PUA assignments ay community-maintained at pwedeng mag-conflict sa iba't ibang font implementations. Palaging i-specify ang exact font na ginagamit ng project ninyo, at i-test ang rendering across browsers.
:::

---

## Mga Script Converters

### Paano Sila Gumagana

Ang script conversion ng rosetta ay isang **post-translation hook**:

1. Itra-translate ng LLM ang text sa isang **working script** (kadalasan Latin o SRO)
2. Iva-validate ng [quality gate](/docs/concepts/quality-gate) ang output
3. Ita-transform ng deterministic converter ang validated text papunta sa **display script**
4. Isusulat sa disk ang na-convert na text

Nagwo-work ang two-step approach na ito dahil mas maganda ang pino-produce na output ng mga LLMs kapag nagwo-work sa mga Latin-based scripts. Gini-guarantee ng deterministic converter ang tamang script output nang hindi umaasa sa (kadalasan ay unreliable na) script knowledge ng model.

### Ang Limang Converters

May kasamang limang built-in script converters ang rosetta:

#### Plains Cree: SRO → Syllabics (`crk`)

Standard Roman Orthography papuntang Canadian Aboriginal Syllabics.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Gumagamit ng macron/circumflex ang mga long vowels: ê, î, ô, â. Hina-handle ng converter ang lahat ng SRO diacritics at mina-map ang mga ito sa tamang syllabic characters. Tingnan ang [Mag-support ng Low-Resource Language](/docs/guides/low-resource-languages) para sa buong Cree pipeline.

#### Serbian: Latin → Cyrillic (`sr`)

Deterministic na Latin-to-Cyrillic conversion para sa Serbian.

```
Input:  "zdravo"
Output: "здраво"
```

Hina-handle nito ang buong Serbian alphabet mapping kasama ang mga digraphs (lj → љ, nj → њ, dž → џ).

#### Klingon: Romanization → pIqaD (`tlh`)

Romanization system ni Marc Okrand papuntang pIqaD PUA characters.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latin → Tengwar (`x-elvish-s`)

Sindarin mode Tengwar mapping ni Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: Latin → Kryptonian (`x-kryptonian`)

Fan-lexicon Kryptonian script mapping.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Pag-trigger ng Converter

I-set ang `scripts` field sa inyong language config. Para sa mga built-in converters, auto-detected na ito mula sa language code:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Auto-detect ang Plains Cree (`crk`) — hindi niyo na kailangang i-set ang `scripts` explicitly.

---

## Mga Multi-Script Languages

May mga totoong languages na gumagamit ng multiple active scripts:

| Language | Scripts | rosetta Approach |
|----------|---------|-----------------|
| Serbian | Latin + Cyrillic | Script converter (`sr`) — i-translate sa Latin, i-convert sa Cyrillic |
| Chinese | Simplified + Traditional | Separate locale codes (`zh` vs `zh-TW`) na may distinct registers |

Para sa mga languages kung saan parehong nagse-serve sa iisang audience ang mga scripts (Serbian), gumamit ng script converter. Para sa mga languages kung saan magkaiba ang sineserve na audience ng mga scripts (Chinese Simplified para sa mainland China, Traditional para sa Taiwan/HK), gumamit ng separate locale codes.

---

## Mga Orthography Notes

Hindi lang tone ang mga registers — nagdadala rin sila ng mga **orthographic instructions** na nagga-guide sa LLM papunta sa mga tamang writing conventions.

### Mga Formal Address Forms

Kasama sa mga built-in registers ng rosetta ang culturally appropriate na formal address para sa bawat language:

| Language | Formal Form | Register Instruction |
|----------|------------|---------------------|
| German | Sie | `Use Sie-form for formal address` |
| French | vous | `Use vous-form` |
| Russian | вы | `Professional register with вы-form` |
| Turkish | siz | `Professional register with siz-form` |
| Korean | 합쇼체 | `Formal Korean (합쇼체)` |
| Japanese | です/ます | `Polite professional register (です/ます form)` |
| Polish | Pan/Pani | `Professional register with Pan/Pani form` |

### Gender-Inclusive Writing

Ang bawat language card ay may `gender.inclusiveGuidance` field na may language-specific advice. Ini-inject ito sa LLM translation prompt nang hiwalay sa register preset, kaya nag-aapply ito consistently kahit anong formality preset pa ang piliin ng user:

- **French**: Écriture inclusive na may interpunct notation (e.g., "Connecté·e")
- **German**: Doppelpunkt notation (e.g., "Benutzer:innen")
- **Spanish**: Preferred ang gender-neutral restructuring; slash notation (e.g., "usuario/a") bilang fallback

Para sa mga languages na walang specific guidance sa kanilang card (e.g., Korean, conlangs), magfo-fallback ang system sa isang generic rule: *"prefer gender-neutral forms or the most inclusive option available."*

### Mga RTL Script Requirements

Naka-note sa lahat ng Arabic, Hebrew, Persian, at Urdu registers ang mga right-to-left requirements: `Ensure text reads naturally in RTL layout contexts.`

### Pag-override ng Kahit Anong Register

Ang bawat register ay isang config value — i-override ito para mag-match sa voice ng project ninyo:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

Tingnan ang [Configuration](/docs/getting-started/configuration) para sa buong config reference.

---

## Pag-add ng Bagong Conlang

### Step-by-step

1. **Pumili ng BCP-47 private-use code**: Gamitin ang `x-` prefix (e.g., `x-dothraki`, `x-valyrian`).

2. **I-add sa inyong config**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Optional) Mag-add ng script converter**: Kung gumagamit ang inyong conlang ng non-Latin display script, mag-add ng converter sa `lib/scripts.js` at i-register ito sa `SCRIPT_CONVERTERS`.

4. **I-test**: I-run ang `i18n-rosetta sync --dry` para ma-preview ang mga translations nang hindi nagsusulat ng files.

5. **I-check ang quality gate**: Baka kailanganing i-tune ang [quality gate](/docs/concepts/quality-gate) para sa inyong conlang — lalo na ang `requireNonLatin` check kung gumagamit ng PUA characters ang conlang ninyo.

:::note Nakadepende ang conlang quality sa LLM knowledge
Kaya lang i-translate ng LLM ang text papunta sa isang conlang kung nakita na niya ito sa training data. Nagwo-work nang maayos ang mga well-documented na conlangs (Klingon, Sindarin, Dothraki). Pwedeng mag-produce ng inconsistent results ang mga obscure o bagong imbento na conlangs. Gumamit ng [coaching data](/docs/concepts/coaching-data) para ma-improve ang quality.
:::

---

## Tingnan Din

- [Mga Supported na Languages](/docs/reference/supported-languages) — buong language table kasama ang method availability
- [Mga Script Converters](/docs/concepts/script-converters) — technical details ng conversion pipeline
- [Mga Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat translation method
- [Configuration](/docs/getting-started/configuration) — config reference kasama ang language at register setup
- [Mag-support ng Low-Resource Language](/docs/guides/low-resource-languages) — ang parehong infrastructure na in-apply sa mga totoong underserved languages