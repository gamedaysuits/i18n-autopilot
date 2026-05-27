---
sidebar_position: 3
title: "Mga Conlang, Script & Orthography"
---
# Conlangs, Scripts & Orthography

May first-class support ang rosetta para sa mga constructed languages (conlangs) via LLM registers at deterministic script converters. Iko-cover po ng guide na ito kung paano gumagana ang conlang support, anong mga fonts ang kailangan ninyo, at kung paano mag-add ng sarili ninyo.

:::tip Bakit mahalaga ang conlangs
Hindi lang po novelty ang mga conlangs — ine-exercise ng mga ito ang exact same infrastructure na ginagamit para sa mga totoong underserved languages. Ang quality gate, coaching system, at script conversion pipeline ay gumagana nang pareho para sa Klingon at Plains Cree. Kung gumagana ang inyong conlang pipeline, gagana rin po ang inyong low-resource language pipeline.
:::

---

## Mga Supported na Constructed Languages

| Language | Code | Script Converter | Font Required |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanization → pIqaD | PUA font (hal., pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ Latin → Tengwar | CSUR PUA font |
| Kryptonian | `x-kryptonian` | ✅ Latin → Kryptonian | PUA font |
| Pirate English | `x-pirate` | ❌ register lang | Wala |
| Shakespearean English | `x-shakespeare` | ❌ register lang | Wala |
| Yoda-speak | `x-yoda` | ❌ register lang | Wala |

Gumagamit po ang mga conlang codes ng `x-` prefix base sa BCP-47 private-use convention, maliban sa Klingon (`tlh`) na may [ISO 639-3](https://iso639-3.sil.org/code/tlh) code na in-assign ng SIL International.

---

## Unicode, PUA, at Font Requirements

### Ang Private Use Area

Ang Klingon (pIqaD), Sindarin (Tengwar), at Kryptonian ay gumagamit ng mga Unicode **Private Use Area (PUA)** characters. Ang PUA ay ang range na U+E000–U+F8FF — ang mga codepoints na ito ay **walang standard assignment**. Minemaintain ng [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) ang mga community-agreed mappings para sa mga fictional scripts, pero hindi po ito part ng Unicode standard.

Ano ang ibig sabihin nito in practice:

- Magre-render ang PUA text bilang mga **empty boxes** (□□□) kapag walang naka-load na tamang font
- Maaaring mag-map ang iba't ibang fonts ng magkakaibang glyphs sa parehong PUA codepoints
- HINDI po naka-bundle ang mga PUA fonts sa rosetta — kailangan ninyo itong i-load mismo
- Hindi kailanman ire-render ng mga system fonts ang mga characters na ito

### PUA Ranges by Script

| Script | PUA Range | CSUR Reference |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | Nag-iiba depende sa font | Walang CSUR standard |

### Pag-load ng mga PUA Web Fonts

May kasamang built-in command ang rosetta para mag-download at mag-manage ng mga PUA web fonts:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

Nagda-download ang `fonts install` command mula sa mga verified open-source repositories:

| Font | Script | License | Source |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (with font exception) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(user-provided)* | Kryptonian | Nag-iiba | Walang available na open-source PUA font |

Naka-auto-detect po ang output directory mula sa inyong project structure (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, default → `public/fonts/`). I-override ito gamit ang `--dir`.

Kung mas gusto ninyong i-manage ang mga fonts manually, mag-add po ng `@font-face` rules sa inyong CSS:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning HINDI guaranteed ang Unicode support
[Explicitly na tinanggihan](https://www.unicode.org/faq/private_use.html) ng Unicode Consortium na i-encode ang mga fictional scripts sa standard. Ang mga PUA assignments ay community-maintained at maaaring mag-conflict sa iba't ibang font implementations. Palagi pong i-specify ang exact font na ginagamit ng inyong project, at i-test ang rendering across browsers.
:::

---

## Mga Script Converters

### Paano Sila Gumagana

Ang script conversion ng rosetta ay isang **post-translation hook**:

1. Tinu-translate ng LLM ang text sa isang **working script** (kadalasang Latin o SRO)
2. Bini-validate ng [quality gate](/docs/concepts/quality-gate) ang output
3. Tinu-transform ng deterministic converter ang validated text papunta sa **display script**
4. Sinu-sulat ang converted text sa disk

Gumagana po ang two-step approach na ito dahil nagpo-produce ng mas magandang output ang mga LLMs kapag nagwo-work sa mga Latin-based scripts. Gini-guarantee ng deterministic converter ang tamang script output nang hindi umaasa sa (madalas ay unreliable na) script knowledge ng model.

### Ang Limang Converters

May kasamang limang built-in script converters ang rosetta:

#### Plains Cree: SRO → Syllabics (`crk`)

Standard Roman Orthography papuntang Canadian Aboriginal Syllabics.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Gumagamit ang mga long vowels ng macron/circumflex: ê, î, ô, â. Hina-handle ng converter ang lahat ng SRO diacritics at minamap ang mga ito sa tamang syllabic characters. Tingnan po ang [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) para sa buong Cree pipeline.

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

### Pagt-trigger ng Converter

I-set po ang `scripts` field sa inyong language config. Para sa mga built-in converters, naka-auto-detect ito mula sa language code:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Naka-auto-detect ang Plains Cree (`crk`) — hindi ninyo na kailangang i-set ang `scripts` explicitly.

---

## Mga Multi-Script Languages

May mga totoong languages na gumagamit ng multiple active scripts:

| Language | Scripts | rosetta Approach |
|----------|---------|-----------------|
| Serbian | Latin + Cyrillic | Script converter (`sr`) — i-translate sa Latin, i-convert sa Cyrillic |
| Chinese | Simplified + Traditional | Separate locale codes (`zh` vs `zh-TW`) na may distinct registers |

Para sa mga languages kung saan parehong nagse-serve sa iisang audience ang mga scripts (Serbian), gumamit po ng script converter. Para sa mga languages kung saan nagse-serve sa magkaibang audiences ang mga scripts (Chinese Simplified para sa mainland China, Traditional para sa Taiwan/HK), gumamit ng separate locale codes.

---

## Mga Orthography Notes

Hindi lang tone ang mga registers — nagdadala rin ang mga ito ng **orthographic instructions** na nagga-guide sa LLM papunta sa mga tamang writing conventions.

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

Bawat language card ay may `gender.inclusiveGuidance` field na may language-specific advice. Ini-inject po ito sa LLM translation prompt nang hiwalay sa register preset, kaya nag-a-apply ito consistently kahit ano pa ang piliing formality preset ng user:

- **French**: Écriture inclusive na may interpunct notation (hal., "Connecté·e")
- **German**: Doppelpunkt notation (hal., "Benutzer:innen")
- **Spanish**: Mas preferred ang gender-neutral restructuring; slash notation (hal., "usuario/a") bilang fallback

Para sa mga languages na walang specific guidance sa kanilang card (hal., Korean, conlangs), magfo-fallback ang system sa isang generic rule: *"prefer gender-neutral forms or the most inclusive option available."*

### Mga RTL Script Requirements

Ang mga Arabic, Hebrew, Persian, at Urdu registers ay lahat nagno-note ng right-to-left requirements: `Ensure text reads naturally in RTL layout contexts.`

### Pag-override sa Kahit Anong Register

Bawat register ay isang config value — i-override po ito para mag-match sa voice ng inyong project:

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

1. **Pumili ng BCP-47 private-use code**: Gamitin ang `x-` prefix (hal., `x-dothraki`, `x-valyrian`).

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

5. **I-check ang quality gate**: Baka kailanganing i-tune ang [quality gate](/docs/concepts/quality-gate) para sa inyong conlang — lalo na ang `requireNonLatin` check kung gumagamit ng PUA characters ang inyong conlang.

:::note Nakadepende sa LLM knowledge ang quality ng conlang
Kaya lang i-translate ng LLM ang text papunta sa isang conlang na nakita na nito sa training data. Maganda ang resulta ng mga well-documented na conlangs (Klingon, Sindarin, Dothraki). Maaaring mag-produce ng inconsistent results ang mga obscure o newly invented na conlangs. Gumamit po ng [coaching data](/docs/concepts/coaching-data) para ma-improve ang quality.
:::

---

## Tingnan Din

- [Supported Languages](/docs/reference/supported-languages) — buong language table kasama ang method availability
- [Script Converters](/docs/concepts/script-converters) — technical details ng conversion pipeline
- [Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat translation method
- [Configuration](/docs/getting-started/configuration) — config reference kasama ang language at register setup
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — ang parehong infrastructure na in-apply sa mga totoong underserved languages