---
sidebar_position: 3
title: "Conlangs, Scripts, at Orthography"
---
# Conlangs, Scripts & Orthography

May first-class support po ang rosetta para sa mga constructed languages via LLM registers at deterministic script converters. Iko-cover po ng guide na ito kung paano gumagana ang conlang support, anong fonts ang kailangan ninyo, at kung paano mag-add ng sarili ninyong conlang.

:::tip Bakit mahalaga ang mga conlangs
Hindi lang po novelty ang mga conlangs — ginagamit nila ang exact same infrastructure na ginagamit para sa mga totoong underserved languages. Ang quality gate, coaching system, at script conversion pipeline ay nagwo-work identically para sa Klingon at Plains Cree. Kung gumagana po ang inyong conlang pipeline, gagana rin ang inyong low-resource language pipeline.
:::

---

## Supported Constructed Languages

| Language | Code | Script Converter | Font Required |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanization → pIqaD | PUA font (e.g., pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ Latin → Tengwar | CSUR PUA font |
| Kryptonian | `x-kryptonian` | ✅ Latin → Kryptonian | PUA font |
| Pirate English | `x-pirate` | ❌ register only | Wala |
| Shakespearean English | `x-shakespeare` | ❌ register only | Wala |
| Yoda-speak | `x-yoda` | ❌ register only | Wala |

Gumagamit po ng `x-` prefix ang mga conlang codes as per BCP-47 private-use convention, maliban sa Klingon (`tlh`) na may [ISO 639-3](https://iso639-3.sil.org/code/tlh) code na in-assign ng SIL International.

---

## Unicode, PUA, at Font Requirements

### Ang Private Use Area

Ang Klingon (pIqaD), Sindarin (Tengwar), at Kryptonian ay gumagamit ng mga Unicode **Private Use Area (PUA)** characters. Ang PUA ay ang range na U+E000–U+F8FF — ang mga codepoints na ito ay **walang standard assignment**. Minemaintain ng [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) ang mga community-agreed mappings para sa mga fictional scripts, pero hindi po ito part ng Unicode standard.

Ang ibig sabihin po nito in practice:

- Magre-render ang PUA text bilang **empty boxes** (□□□) kapag walang naka-load na tamang font
- Maaaring mag-map ang iba't ibang fonts ng magkakaibang glyphs sa parehong PUA codepoints
- HINDI po naka-bundle ang PUA fonts sa rosetta — kailangan ninyo itong i-load mismo
- Hindi kailanman ire-render ng system fonts ang mga characters na ito

### PUA Ranges by Script

| Script | PUA Range | CSUR Reference |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | Varies by font | Walang CSUR standard |

### Pag-load ng PUA Web Fonts

Para ma-display ang PUA-based conlang text sa inyong web application, i-load po ang appropriate font via CSS:

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
[Explicitly declined](https://www.unicode.org/faq/private_use.html) po ng Unicode Consortium na i-encode ang mga fictional scripts sa standard. Ang mga PUA assignments ay community-maintained at maaaring mag-conflict sa pagitan ng iba't ibang font implementations. Palagi pong i-specify ang exact font na ginagamit ng inyong project, at i-test ang rendering across browsers.
:::

---

## Script Converters

### Paano Sila Gumagana

Ang script conversion ng rosetta ay isang **post-translation hook**:

1. Ita-translate ng LLM ang text sa isang **working script** (usually Latin o SRO)
2. Iva-validate ng [quality gate](/docs/concepts/quality-gate) ang output
3. Ita-transform ng deterministic converter ang validated text papunta sa **display script**
4. Isusulat ang converted text sa disk

Nagwo-work po ang two-step approach na ito dahil nagpo-produce ng mas magandang output ang mga LLMs kapag nagtatrabaho sa mga Latin-based scripts. Gini-guarantee ng deterministic converter ang tamang script output nang hindi umaasa sa (madalas unreliable na) script knowledge ng model.

### Ang Limang Converters

May kasama pong limang built-in script converters ang rosetta:

#### Plains Cree: SRO → Syllabics (`crk`)

Standard Roman Orthography papuntang Canadian Aboriginal Syllabics.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Gumagamit po ng macron/circumflex ang mga long vowels: ê, î, ô, â. Hina-handle ng converter ang lahat ng SRO diacritics at mina-map ang mga ito sa tamang syllabic characters. Tingnan ang [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) para sa buong Cree pipeline.

#### Serbian: Latin → Cyrillic (`sr`)

Deterministic na Latin-to-Cyrillic conversion para sa Serbian.

```
Input:  "zdravo"
Output: "здраво"
```

Hina-handle po nito ang buong Serbian alphabet mapping kasama na ang mga digraphs (lj → љ, nj → њ, dž → џ).

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

I-set po ang `scripts` field sa inyong language config. Para sa mga built-in converters, auto-detected na po ito mula sa language code:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Auto-detects po ang Plains Cree (`crk`) — hindi ninyo na kailangang i-set ang `scripts` explicitly.

---

## Multi-Script Languages

May mga totoong languages po na gumagamit ng multiple active scripts:

| Language | Scripts | rosetta Approach |
|----------|---------|-----------------|
| Serbian | Latin + Cyrillic | Script converter (`sr`) — i-translate sa Latin, i-convert sa Cyrillic |
| Chinese | Simplified + Traditional | Separate locale codes (`zh` vs `zh-TW`) na may distinct registers |

Para sa mga languages kung saan parehong nagse-serve sa iisang audience ang mga scripts (Serbian), gumamit po ng script converter. Para sa mga languages kung saan nagse-serve sa magkaibang audiences ang mga scripts (Chinese Simplified para sa mainland China, Traditional para sa Taiwan/HK), gumamit ng separate locale codes.

---

## Orthography Notes

Hindi lang po tone ang registers — nagdadala rin sila ng **orthographic instructions** na nagga-guide sa LLM papunta sa mga tamang writing conventions.

### Formal Address Forms

Kasama po sa built-in registers ng rosetta ang culturally appropriate na formal address para sa bawat language:

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

Bawat language card po ay may `gender.inclusiveGuidance` field na may language-specific advice. Naka-inject po ito sa LLM translation prompt nang hiwalay sa register preset, kaya nag-a-apply ito consistently regardless kung anong formality preset ang piliin ng user:

- **French**: Écriture inclusive na may interpunct notation (e.g., "Connecté·e")
- **German**: Doppelpunkt notation (e.g., "Benutzer:innen")
- **Spanish**: Preferred ang gender-neutral restructuring; slash notation (e.g., "usuario/a") bilang fallback

Para sa mga languages na walang specific guidance sa kanilang card (e.g., Korean, conlangs), magfa-fallback ang system sa isang generic rule: *"prefer gender-neutral forms or the most inclusive option available."*

### RTL Script Requirements

Naka-note po sa lahat ng Arabic, Hebrew, Persian, at Urdu registers ang right-to-left requirements: `Ensure text reads naturally in RTL layout contexts.`

### Pag-override ng Kahit Anong Register

Bawat register po ay isang config value — i-override ito para mag-match sa voice ng inyong project:

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

Tingnan po ang [Configuration](/docs/getting-started/configuration) para sa buong config reference.

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

4. **I-test**: I-run ang `i18n-rosetta sync --dry` para ma-preview ang translations nang hindi nagsusulat ng files.

5. **I-check ang quality gate**: Baka kailanganing i-tune ang [quality gate](/docs/concepts/quality-gate) para sa inyong conlang — lalo na ang `requireNonLatin` check kung gumagamit ang inyong conlang ng PUA characters.

:::note Nakadepende ang conlang quality sa LLM knowledge
Makakapag-translate lang po ang LLM sa isang conlang na nakita na nito sa training data. Nagwo-work nang maayos ang mga well-documented conlangs (Klingon, Sindarin, Dothraki). Maaaring mag-produce ng inconsistent results ang mga obscure o newly invented conlangs. Gumamit po ng [coaching data](/docs/concepts/coaching-data) para ma-improve ang quality.
:::

---

## Tingnan Din

- [Supported Languages](/docs/reference/supported-languages) — buong language table kasama ang method availability
- [Script Converters](/docs/concepts/script-converters) — technical details ng conversion pipeline
- [Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat translation method
- [Configuration](/docs/getting-started/configuration) — config reference kasama ang language at register setup
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — ang same infrastructure na in-apply sa mga totoong underserved languages